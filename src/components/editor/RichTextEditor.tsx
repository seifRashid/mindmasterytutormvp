"use client";

import { useRef, useState, useEffect, useCallback, type KeyboardEvent } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Undo2, Redo2, Maximize2, Minimize2, Eye, FileCode2,
  ChevronDown, Eraser, Info, Highlighter, Palette, Pilcrow,
  Code2, SquarePen, X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
}

type ViewMode = "edit" | "preview" | "source";

// ── Constants ─────────────────────────────────────────────────────────────────

const TEXT_COLORS = [
  "#000000","#1e293b","#374151","#6b7280","#9ca3af","#d1d5db","#f1f5f9","#ffffff",
  "#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#14b8a6","#06b6d4",
  "#3b82f6","#6366f1","#8b5cf6","#a855f7","#ec4899","#f43f5e","#0ea5e9","#10b981",
];

const HIGHLIGHT_COLORS = [
  "none","#fef08a","#fed7aa","#fecaca","#bbf7d0","#bfdbfe","#e9d5ff","#fbcfe8",
  "#e2e8f0","#fde047","#fb923c","#f87171","#4ade80","#60a5fa","#a78bfa","#f472b6",
];

const FONT_FAMILIES = [
  { label: "Default",          value: "" },
  { label: "Arial",            value: "Arial" },
  { label: "Georgia",          value: "Georgia" },
  { label: "Times New Roman",  value: "Times New Roman" },
  { label: "Courier New",      value: "Courier New" },
  { label: "Verdana",          value: "Verdana" },
  { label: "Trebuchet MS",     value: "Trebuchet MS" },
  { label: "Impact",           value: "Impact" },
];

const BLOCK_FORMATS = [
  { label: "Paragraph",  tag: "p",          Icon: Pilcrow   },
  { label: "Heading 1",  tag: "h1",         Icon: Heading1  },
  { label: "Heading 2",  tag: "h2",         Icon: Heading2  },
  { label: "Heading 3",  tag: "h3",         Icon: Heading3  },
  { label: "Blockquote", tag: "blockquote", Icon: Quote     },
  { label: "Code Block", tag: "pre",        Icon: Code2     },
];

// ── Stats helper ───────────────────────────────────────────────────────────────

function calcStats(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const chars = text.length;
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 200));
  const blocks = (html.match(/<(p|h[1-6]|blockquote|pre|li)[>\s]/gi) ?? []).length || (text ? 1 : 0);
  return { chars, words, readTime, blocks };
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

function Tip({
  children, tip, shortcut,
}: { children: React.ReactNode; tip: string; shortcut?: string }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] pointer-events-none
                      opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-200">
        <div className="bg-slate-900 dark:bg-slate-700 text-white text-[11px] rounded-lg
                        px-2.5 py-1.5 flex items-center gap-1.5 whitespace-nowrap shadow-xl
                        border border-white/10">
          <span>{tip}</span>
          {shortcut && (
            <kbd className="bg-slate-700 dark:bg-slate-600 rounded px-1.5 py-0.5 text-[10px]
                           font-mono text-slate-300 border border-slate-600/60">
              {shortcut}
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toolbar Button ─────────────────────────────────────────────────────────────

function TBtn({
  onClick, active, disabled, children, className = "",
}: {
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      disabled={disabled}
      className={[
        "flex items-center justify-center w-7 h-7 rounded-md text-sm transition-all select-none flex-shrink-0",
        active
          ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────

function Sep() {
  return <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0" />;
}

// ── Color Swatch Panel ────────────────────────────────────────────────────────

function ColorPanel({
  colors, title, onSelect, onClose,
}: {
  colors: string[]; title: string;
  onSelect: (c: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute top-full left-0 mt-1.5 z-[9999] bg-white dark:bg-slate-800
                 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 w-56"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{title}</span>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onClose(); }}
          className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {colors.map((c, i) => (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}
            title={c}
            className={[
              "w-6 h-6 rounded-md border-2 transition-all hover:scale-110 hover:border-blue-400",
              c === "none" ? "border-slate-200 dark:border-slate-600" : "border-transparent",
            ].join(" ")}
            style={{
              background: c === "none"
                ? "linear-gradient(to bottom right, #fff 50%, #f1f5f9 50%)"
                : c,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Generic Dropdown ──────────────────────────────────────────────────────────

function Dropdown({ children, onMouseDown }: { children: React.ReactNode; onMouseDown?: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="absolute top-full left-0 mt-1.5 z-[9999] bg-white dark:bg-slate-800
                 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1 min-w-[170px]"
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
}

function DropItem({
  onClick, children, className = "",
}: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={[
        "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200",
        "hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing your lesson content...",
  readOnly = false,
  minHeight = 420,
}: RichTextEditorProps) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastHtml   = useRef<string>(value);
  const mounted    = useRef(false);

  const [viewMode,        setViewMode]        = useState<ViewMode>("edit");
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [colorPicker,     setColorPicker]     = useState<"text" | "hl" | null>(null);
  const [showBlockMenu,   setShowBlockMenu]   = useState(false);
  const [showFontMenu,    setShowFontMenu]    = useState(false);
  const [active,          setActive]          = useState<Record<string, boolean>>({});
  const [stats,           setStats]           = useState({ chars: 0, words: 0, readTime: 1, blocks: 0 });
  const [sourceHtml,      setSourceHtml]      = useState(value);
  const [isEmpty,         setIsEmpty]         = useState(!value);

  // ── Mount: set initial content ─────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current && !mounted.current) {
      editorRef.current.innerHTML = value || "";
      lastHtml.current = value || "";
      setStats(calcStats(value || ""));
      setIsEmpty(!value);
      mounted.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync external value prop ───────────────────────────────────────────────
  useEffect(() => {
    if (mounted.current && editorRef.current && value !== lastHtml.current) {
      editorRef.current.innerHTML = value || "";
      lastHtml.current = value || "";
      setStats(calcStats(value || ""));
      setIsEmpty(!value);
    }
    setSourceHtml(value || "");
  }, [value]);

  // ── Selection save/restore ─────────────────────────────────────────────────
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }, []);

  // ── Focus + restore ────────────────────────────────────────────────────────
  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
    restoreSelection();
  }, [restoreSelection]);

  // ── Notify parent of changes ───────────────────────────────────────────────
  const notifyChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    const normalized = (html === "<br>" || html === "<div><br></div>") ? "" : html;
    lastHtml.current = normalized;
    onChange?.(normalized);
    setStats(calcStats(normalized));
    setIsEmpty(!normalized);
  }, [onChange]);

  // ── execCommand wrapper ────────────────────────────────────────────────────
  const exec = useCallback((cmd: string, val?: string) => {
    focusEditor();
    document.execCommand(cmd, false, val);
    notifyChange();
    updateActive();
  }, [focusEditor, notifyChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Track active formats ───────────────────────────────────────────────────
  const updateActive = useCallback(() => {
    try {
      setActive({
        bold:               document.queryCommandState("bold"),
        italic:             document.queryCommandState("italic"),
        underline:          document.queryCommandState("underline"),
        strikeThrough:      document.queryCommandState("strikeThrough"),
        subscript:          document.queryCommandState("subscript"),
        superscript:        document.queryCommandState("superscript"),
        insertUnorderedList:document.queryCommandState("insertUnorderedList"),
        insertOrderedList:  document.queryCommandState("insertOrderedList"),
        justifyLeft:        document.queryCommandState("justifyLeft"),
        justifyCenter:      document.queryCommandState("justifyCenter"),
        justifyRight:       document.queryCommandState("justifyRight"),
        justifyFull:        document.queryCommandState("justifyFull"),
      });
    } catch { /* ignore */ }
  }, []);

  // ── Input handler ──────────────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    notifyChange();
  }, [notifyChange]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    if      (e.key === "b")                  { e.preventDefault(); exec("bold"); }
    else if (e.key === "i")                  { e.preventDefault(); exec("italic"); }
    else if (e.key === "u")                  { e.preventDefault(); exec("underline"); }
    else if (e.key === "z" && !e.shiftKey)   { e.preventDefault(); exec("undo"); }
    else if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); exec("redo"); }
  }, [exec]);

  // ── Special inserts ────────────────────────────────────────────────────────
  const insertInlineCode = useCallback(() => {
    focusEditor();
    const sel = window.getSelection();
    const txt = sel?.toString() || "code";
    document.execCommand("insertHTML", false, `<code>${txt}</code>`);
    notifyChange();
  }, [focusEditor, notifyChange]);

  const insertCodeBlock = useCallback(() => {
    focusEditor();
    const sel = window.getSelection();
    const txt = sel?.toString() || "// your code here";
    document.execCommand("insertHTML", false,
      `<pre><code>${txt}</code></pre><p><br></p>`);
    notifyChange();
    setShowBlockMenu(false);
  }, [focusEditor, notifyChange]);

  const insertCallout = useCallback(() => {
    focusEditor();
    const sel = window.getSelection();
    const txt = sel?.toString() || "Add your note here";
    document.execCommand("insertHTML", false,
      `<div class="rte-callout"><strong>📌 Note</strong><p>${txt}</p></div><p><br></p>`);
    notifyChange();
    setShowBlockMenu(false);
  }, [focusEditor, notifyChange]);

  // ── Block format ───────────────────────────────────────────────────────────
  const applyBlock = useCallback((tag: string) => {
    if (tag === "pre")     { insertCodeBlock(); return; }
    exec("formatBlock", `<${tag}>`);
    setShowBlockMenu(false);
  }, [exec, insertCodeBlock]);

  // ── Colors ─────────────────────────────────────────────────────────────────
  const applyColor = useCallback((color: string, type: "text" | "hl") => {
    restoreSelection();
    focusEditor();
    if (type === "text") {
      document.execCommand("foreColor", false, color);
    } else {
      if (color === "none") {
        document.execCommand("removeFormat", false, undefined);
      } else {
        try { document.execCommand("hiliteColor", false, color); }
        catch { document.execCommand("backColor", false, color); }
      }
    }
    notifyChange();
    setColorPicker(null);
  }, [restoreSelection, focusEditor, notifyChange]);

  // ── Font ───────────────────────────────────────────────────────────────────
  const applyFont = useCallback((font: string) => {
    restoreSelection();
    focusEditor();
    if (font) document.execCommand("fontName", false, font);
    notifyChange();
    setShowFontMenu(false);
  }, [restoreSelection, focusEditor, notifyChange]);

  // ── View mode switch ───────────────────────────────────────────────────────
  const switchMode = useCallback((mode: ViewMode) => {
    const cur = editorRef.current?.innerHTML ?? "";
    if (viewMode === "edit") setSourceHtml(cur);
    if (viewMode === "source" && mode !== "source") {
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceHtml;
        lastHtml.current = sourceHtml;
        onChange?.(sourceHtml);
      }
    }
    setViewMode(mode);
  }, [viewMode, sourceHtml, onChange]);

  // ── Global listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    document.addEventListener("selectionchange", updateActive);
    return () => document.removeEventListener("selectionchange", updateActive);
  }, [updateActive]);

  useEffect(() => {
    const close = () => { setShowBlockMenu(false); setShowFontMenu(false); setColorPicker(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // ── Current block label ────────────────────────────────────────────────────
  const currentBlockLabel = (() => {
    if (typeof window === "undefined") return "Paragraph";
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return "Paragraph";
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1) {
        const t = (node as Element).tagName.toLowerCase();
        const found = BLOCK_FORMATS.find((f) => f.tag === t);
        if (found) return found.label;
      }
      node = node.parentNode;
    }
    return "Paragraph";
  })();

  // ── TOOLBAR ────────────────────────────────────────────────────────────────

  const toolbar = !readOnly && (
    <div
      className="border-b border-slate-200 dark:border-slate-800
                 bg-white dark:bg-slate-900 overflow-x-auto"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5 px-2 py-1.5 min-w-max">

        {/* History */}
        <Tip tip="Undo" shortcut="Ctrl+Z">
          <TBtn onClick={() => exec("undo")}><Undo2 className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Redo" shortcut="Ctrl+Y">
          <TBtn onClick={() => exec("redo")}><Redo2 className="w-3.5 h-3.5" /></TBtn>
        </Tip>

        <Sep />

        {/* Block Format */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Block Style">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowBlockMenu((b) => !b);
                setShowFontMenu(false);
                setColorPicker(null);
              }}
              className="flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium
                         text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700
                         transition-all cursor-pointer select-none flex-shrink-0"
            >
              <span className="w-[84px] text-left truncate">{currentBlockLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
            </button>
          </Tip>
          {showBlockMenu && (
            <Dropdown onMouseDown={(e) => e.stopPropagation()}>
              {BLOCK_FORMATS.map(({ label, tag, Icon }) => (
                <DropItem key={tag} onClick={() => applyBlock(tag)}>
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{label}</span>
                </DropItem>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <DropItem onClick={insertCallout}>
                <Info className="w-4 h-4 text-blue-500" />
                <span>Callout Box</span>
              </DropItem>
            </Dropdown>
          )}
        </div>

        <Sep />

        {/* Font Family */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Font Family">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowFontMenu((b) => !b);
                setShowBlockMenu(false);
                setColorPicker(null);
              }}
              className="flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium
                         text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700
                         transition-all cursor-pointer select-none flex-shrink-0"
            >
              <span>Font</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </Tip>
          {showFontMenu && (
            <Dropdown onMouseDown={(e) => e.stopPropagation()}>
              {FONT_FAMILIES.map(({ label, value }) => (
                <DropItem key={label} onClick={() => applyFont(value)}>
                  <span style={{ fontFamily: value || "inherit" }}>{label}</span>
                </DropItem>
              ))}
            </Dropdown>
          )}
        </div>

        <Sep />

        {/* Text Style */}
        <Tip tip="Bold" shortcut="Ctrl+B">
          <TBtn onClick={() => exec("bold")} active={active.bold}><Bold className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Italic" shortcut="Ctrl+I">
          <TBtn onClick={() => exec("italic")} active={active.italic}><Italic className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Underline" shortcut="Ctrl+U">
          <TBtn onClick={() => exec("underline")} active={active.underline}><Underline className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Strikethrough">
          <TBtn onClick={() => exec("strikeThrough")} active={active.strikeThrough}><Strikethrough className="w-3.5 h-3.5" /></TBtn>
        </Tip>

        <Sep />

        {/* Code / Sub / Super */}
        <Tip tip="Inline Code">
          <TBtn onClick={insertInlineCode}><Code className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Subscript">
          <TBtn onClick={() => exec("subscript")} active={active.subscript}><Subscript className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Superscript">
          <TBtn onClick={() => exec("superscript")} active={active.superscript}><Superscript className="w-3.5 h-3.5" /></TBtn>
        </Tip>

        <Sep />

        {/* Text Color */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Text Color">
            <TBtn onClick={() => { saveSelection(); setColorPicker((p) => p === "text" ? null : "text"); setShowBlockMenu(false); setShowFontMenu(false); }}>
              <Palette className="w-3.5 h-3.5" />
            </TBtn>
          </Tip>
          {colorPicker === "text" && (
            <ColorPanel colors={TEXT_COLORS} title="Text Color" onSelect={(c) => applyColor(c, "text")} onClose={() => setColorPicker(null)} />
          )}
        </div>

        {/* Highlight Color */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Highlight Color">
            <TBtn onClick={() => { saveSelection(); setColorPicker((p) => p === "hl" ? null : "hl"); setShowBlockMenu(false); setShowFontMenu(false); }}>
              <Highlighter className="w-3.5 h-3.5" />
            </TBtn>
          </Tip>
          {colorPicker === "hl" && (
            <ColorPanel colors={HIGHLIGHT_COLORS} title="Highlight Color" onSelect={(c) => applyColor(c, "hl")} onClose={() => setColorPicker(null)} />
          )}
        </div>

        <Sep />

        {/* Alignment */}
        <Tip tip="Align Left">
          <TBtn onClick={() => exec("justifyLeft")} active={active.justifyLeft}><AlignLeft className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Align Center">
          <TBtn onClick={() => exec("justifyCenter")} active={active.justifyCenter}><AlignCenter className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Align Right">
          <TBtn onClick={() => exec("justifyRight")} active={active.justifyRight}><AlignRight className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Justify">
          <TBtn onClick={() => exec("justifyFull")} active={active.justifyFull}><AlignJustify className="w-3.5 h-3.5" /></TBtn>
        </Tip>

        <Sep />

        {/* Lists */}
        <Tip tip="Bulleted List">
          <TBtn onClick={() => exec("insertUnorderedList")} active={active.insertUnorderedList}><List className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Numbered List">
          <TBtn onClick={() => exec("insertOrderedList")} active={active.insertOrderedList}><ListOrdered className="w-3.5 h-3.5" /></TBtn>
        </Tip>

        <Sep />

        {/* Clear */}
        <Tip tip="Clear Formatting">
          <TBtn onClick={() => exec("removeFormat")}><Eraser className="w-3.5 h-3.5" /></TBtn>
        </Tip>

        {/* Spacer */}
        <div className="w-4 flex-shrink-0" />

        {/* View Mode Tab Strip */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex-shrink-0">
          {([
            { mode: "edit" as const,    Icon: SquarePen,  tip: "Edit" },
            { mode: "preview" as const, Icon: Eye,        tip: "Preview" },
            { mode: "source" as const,  Icon: FileCode2,  tip: "Source Code" },
          ]).map(({ mode, Icon, tip: t }) => (
            <Tip key={mode} tip={t}>
              <TBtn
                onClick={() => switchMode(mode)}
                active={viewMode === mode}
                className={viewMode === mode
                  ? "bg-white dark:bg-slate-700 shadow-sm !text-blue-600 dark:!text-blue-400"
                  : ""}
              >
                <Icon className="w-3.5 h-3.5" />
              </TBtn>
            </Tip>
          ))}
        </div>

        {/* Fullscreen */}
        <Tip tip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          <TBtn onClick={() => setIsFullscreen((f) => !f)}>
            {isFullscreen
              ? <Minimize2 className="w-3.5 h-3.5" />
              : <Maximize2 className="w-3.5 h-3.5" />
            }
          </TBtn>
        </Tip>
      </div>
    </div>
  );

  // ── EDITING SURFACE ────────────────────────────────────────────────────────

  const surface = (
    <div className="relative flex-1">
      {/* Edit mode */}
      <div
        ref={editorRef}
        contentEditable={!readOnly && viewMode === "edit" ? true : undefined}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={updateActive}
        onKeyUp={updateActive}
        onFocus={updateActive}
        data-placeholder={placeholder}
        className={[
          "rte-content w-full outline-none px-7 py-6",
          "text-slate-900 dark:text-slate-100 text-sm leading-7",
          "overflow-y-auto",
          viewMode !== "edit" ? "hidden" : "",
          readOnly ? "cursor-default" : "",
        ].join(" ")}
        style={{ minHeight }}
      />

      {/* Placeholder */}
      {viewMode === "edit" && isEmpty && !readOnly && (
        <div
          className="absolute top-6 left-7 text-slate-400 dark:text-slate-600 text-sm pointer-events-none select-none"
          aria-hidden
        >
          {placeholder}
        </div>
      )}

      {/* Preview mode */}
      {viewMode === "preview" && (
        <div
          className="rte-content w-full px-7 py-6 text-slate-900 dark:text-slate-100 text-sm leading-7 overflow-y-auto"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{
            __html: lastHtml.current || `<p class="rte-placeholder">${placeholder}</p>`,
          }}
        />
      )}

      {/* Source mode */}
      {viewMode === "source" && (
        <textarea
          value={sourceHtml}
          onChange={(e) => {
            const v = e.target.value;
            setSourceHtml(v);
            lastHtml.current = v;
            onChange?.(v);
          }}
          spellCheck={false}
          className="w-full bg-slate-950 text-emerald-400 font-mono text-xs
                     px-7 py-6 outline-none resize-none"
          style={{ minHeight }}
        />
      )}
    </div>
  );

  // ── STATS BAR ──────────────────────────────────────────────────────────────

  const statsBar = (
    <div className="flex items-center gap-5 px-5 py-2 border-t border-slate-100 dark:border-slate-800
                    bg-slate-50 dark:bg-slate-950/50 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
      <span>
        <span className="font-bold text-slate-700 dark:text-slate-300">{stats.chars.toLocaleString()}</span>
        {" "}chars
      </span>
      <span>
        <span className="font-bold text-slate-700 dark:text-slate-300">{stats.words.toLocaleString()}</span>
        {" "}words
      </span>
      <span>
        <span className="font-bold text-slate-700 dark:text-slate-300">{stats.readTime}</span>
        {" "}min read
      </span>
      <span>
        <span className="font-bold text-slate-700 dark:text-slate-300">{stats.blocks}</span>
        {" "}blocks
      </span>
      <div className="flex-1" />
      <span className={[
        "font-semibold uppercase tracking-wider text-[10px]",
        viewMode === "edit"    ? "text-blue-500"   :
        viewMode === "preview" ? "text-violet-500" :
        "text-emerald-500",
      ].join(" ")}>
        {viewMode === "edit" ? "✏ Editing" : viewMode === "preview" ? "👁 Preview" : "</> Source"}
      </span>
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={[
        "flex flex-col border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden",
        "bg-white dark:bg-slate-900 shadow-sm",
        isFullscreen ? "fixed inset-0 z-[9999] rounded-none border-none shadow-none" : "",
      ].join(" ")}
    >
      {toolbar}
      {surface}
      {statsBar}
    </div>
  );
}
