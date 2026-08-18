"use client";

import { useRef, useState, useEffect, useCallback, type KeyboardEvent } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3, Heading4,
  Undo2, Redo2, Maximize2, Minimize2, Eye, FileCode2,
  ChevronDown, Eraser, Highlighter, Palette, Pilcrow,
  Code2, SquarePen, X, Link2, Image as ImageIcon, Table2,
  Minus, Indent, Outdent, LayoutTemplate, BookOpen,
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
type ModalType = "link" | "image" | "table" | null;

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
  { label: "Default",         value: "" },
  { label: "Arial",           value: "Arial, sans-serif" },
  { label: "Georgia",         value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New",     value: "'Courier New', monospace" },
  { label: "Verdana",         value: "Verdana, sans-serif" },
  { label: "Trebuchet MS",    value: "'Trebuchet MS', sans-serif" },
];

const FONT_SIZES = [
  { label: "Small",   value: "2" },
  { label: "Normal",  value: "3" },
  { label: "Medium",  value: "4" },
  { label: "Large",   value: "5" },
  { label: "X-Large", value: "6" },
  { label: "XX-Large",value: "7" },
];

const BLOCK_FORMATS = [
  { label: "Paragraph",  tag: "p",          Icon: Pilcrow   },
  { label: "Heading 1",  tag: "h1",         Icon: Heading1  },
  { label: "Heading 2",  tag: "h2",         Icon: Heading2  },
  { label: "Heading 3",  tag: "h3",         Icon: Heading3  },
  { label: "Heading 4",  tag: "h4",         Icon: Heading4  },
  { label: "Blockquote", tag: "blockquote", Icon: Quote     },
  { label: "Code Block", tag: "pre",        Icon: Code2     },
];

const EDU_BLOCKS = [
  { label: "Key Point",     emoji: "💡", cls: "rte-block-keypoint",   title: "Key Point"    },
  { label: "Important",     emoji: "📌", cls: "rte-block-important",  title: "Important"    },
  { label: "Example",       emoji: "📝", cls: "rte-block-example",    title: "Example"      },
  { label: "Remember",      emoji: "⚠️", cls: "rte-block-remember",  title: "Remember"     },
  { label: "Think About It",emoji: "❓", cls: "rte-block-think",      title: "Think About It"},
  { label: "Summary",       emoji: "✅", cls: "rte-block-summary",    title: "Summary"      },
  { label: "Definition",    emoji: "📖", cls: "rte-block-definition", title: "Definition"   },
  { label: "Formula",       emoji: "∑",  cls: "rte-block-formula",    title: "Formula"      },
];

// ── Stats helper ───────────────────────────────────────────────────────────────

function calcStats(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const chars = text.length;
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 200));
  const blocks = (html.match(/<(p|h[1-6]|blockquote|pre|li)[\s>]/gi) ?? []).length || (text ? 1 : 0);
  return { chars, words, readTime, blocks };
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

function Tip({ children, tip, shortcut }: { children: React.ReactNode; tip: string; shortcut?: string }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-300">
        <div className="bg-slate-900 dark:bg-slate-700 text-white text-[11px] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 whitespace-nowrap shadow-xl border border-white/10">
          <span>{tip}</span>
          {shortcut && (
            <kbd className="bg-slate-700 dark:bg-slate-600 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-600/60">
              {shortcut}
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toolbar Button ─────────────────────────────────────────────────────────────

function TBtn({ onClick, active, disabled, children, className = "" }: {
  onClick?: () => void; active?: boolean; disabled?: boolean;
  children: React.ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      disabled={disabled}
      className={[
        "flex items-center justify-center w-7 h-7 rounded-md text-sm transition-all select-none flex-shrink-0",
        active
          ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold"
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
  return <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />;
}

// ── Color Swatch Panel ────────────────────────────────────────────────────────

function ColorPanel({ colors, title, onSelect, onClose }: {
  colors: string[]; title: string; onSelect: (c: string) => void; onClose: () => void;
}) {
  return (
    <div
      className="absolute top-full left-0 mt-1.5 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 w-56"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{title}</span>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onClose(); }}
          className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
        >
          <X className="w-3.5 h-3.5" />
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
              "w-5 h-5 rounded-md border transition-all hover:scale-110 hover:border-blue-500",
              c === "none" ? "border-slate-300 dark:border-slate-600" : "border-transparent",
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

function Dropdown({ children, onMouseDown, className = "" }: {
  children: React.ReactNode; onMouseDown?: (e: React.MouseEvent) => void; className?: string;
}) {
  return (
    <div
      className={`absolute top-full left-0 mt-1.5 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 min-w-[190px] max-h-[350px] overflow-y-auto ${className}`}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
}

function DropItem({
  onClick,
  children,
  className = "",
  active = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={[
        "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left select-none cursor-pointer",
        active
          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Insertion Modal ────────────────────────────────────────────────────────────

function InsertModal({ type, onClose, onInsert }: {
  type: ModalType; onClose: () => void; onInsert: (html: string) => void;
}) {
  const [linkText,  setLinkText]  = useState("");
  const [linkUrl,   setLinkUrl]   = useState("https://");
  const [imgUrl,    setImgUrl]    = useState("");
  const [imgAlt,    setImgAlt]    = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [hoverCell, setHoverCell] = useState<[number, number]>([0, 0]);

  if (!type) return null;

  const handleLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || linkUrl;
    onInsert(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`);
  };

  const handleImage = () => {
    if (!imgUrl.trim()) return;
    const alt = imgAlt.trim() || "Image";
    onInsert(`<figure class="rte-figure"><img src="${imgUrl}" alt="${alt}" class="rte-img" />${imgAlt ? `<figcaption class="rte-figcaption">${imgAlt}</figcaption>` : ""}</figure><p><br></p>`);
  };

  const handleTable = () => {
    const finalRows = hoverCell[0] > 0 ? hoverCell[0] : tableRows;
    const finalCols = hoverCell[1] > 0 ? hoverCell[1] : tableCols;
    const headerRow = `<tr>${Array.from({ length: finalCols }, (_, i) => `<th>Column ${i + 1}</th>`).join("")}</tr>`;
    const bodyRows = Array.from({ length: Math.max(1, finalRows - 1) }, () =>
      `<tr>${Array.from({ length: finalCols }, () => "<td>&nbsp;</td>").join("")}</tr>`
    ).join("");
    onInsert(`<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table><p><br></p>`);
  };

  const finalRows = hoverCell[0] > 0 ? hoverCell[0] : tableRows;
  const finalCols = hoverCell[1] > 0 ? hoverCell[1] : tableCols;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            {type === "link" && "Insert Link"}
            {type === "image" && "Insert Image"}
            {type === "table" && "Insert Table"}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {type === "link" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Display Text</label>
                <input autoFocus value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link text (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">URL *</label>
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com"
                  onKeyDown={(e) => { if (e.key === "Enter") handleLink(); }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          {type === "image" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Image URL *</label>
                <input autoFocus value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="https://example.com/image.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Caption / Alt Text</label>
                <input value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} placeholder="Describe the image..."
                  onKeyDown={(e) => { if (e.key === "Enter") handleImage(); }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          {type === "table" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Hover over the grid to select table size, or enter dimensions below.</p>
              <div className="flex gap-0.5" onMouseLeave={() => setHoverCell([0, 0])}>
                {Array.from({ length: 8 }, (_, col) => (
                  <div key={col} className="flex flex-col gap-0.5">
                    {Array.from({ length: 8 }, (_, row) => (
                      <div key={row}
                        onMouseEnter={() => setHoverCell([row + 1, col + 1])}
                        onClick={() => { setTableRows(row + 1); setTableCols(col + 1); }}
                        className={["w-5 h-5 rounded-sm border cursor-pointer transition-colors",
                          row < (hoverCell[0] || 0) && col < (hoverCell[1] || 0)
                            ? "bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-600"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {finalRows} × {finalCols} table
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Rows</label>
                  <input type="number" min={1} max={20} value={tableRows} onChange={(e) => setTableRows(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Columns</label>
                  <input type="number" min={1} max={10} value={tableCols} onChange={(e) => setTableCols(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button type="button"
            onClick={() => {
              if (type === "link")  handleLink();
              if (type === "image") handleImage();
              if (type === "table") handleTable();
            }}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm">
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing your lesson content...",
  readOnly = false,
  minHeight = 480,
}: RichTextEditorProps) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastHtml   = useRef<string>(value);
  const mounted    = useRef(false);

  const [viewMode,      setViewMode]      = useState<ViewMode>("edit");
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [colorPicker,   setColorPicker]   = useState<"text" | "hl" | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [showFontMenu,  setShowFontMenu]  = useState(false);
  const [showSizeMenu,  setShowSizeMenu]  = useState(false);
  const [showEduMenu,   setShowEduMenu]   = useState(false);
  const [modal,         setModal]         = useState<ModalType>(null);
  const [active,        setActive]        = useState<Record<string, boolean>>({});
  const [stats,         setStats]         = useState({ chars: 0, words: 0, readTime: 1, blocks: 0 });
  const [sourceHtml,    setSourceHtml]    = useState(value);
  const [isEmpty,       setIsEmpty]       = useState(!value);

  const closeAllMenus = useCallback(() => {
    setShowBlockMenu(false);
    setShowFontMenu(false);
    setShowSizeMenu(false);
    setShowEduMenu(false);
    setColorPicker(null);
  }, []);

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current && !mounted.current) {
      editorRef.current.innerHTML = value || "";
      lastHtml.current = value || "";
      setStats(calcStats(value || ""));
      setIsEmpty(!value);
      mounted.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mounted.current && editorRef.current && value !== lastHtml.current) {
      editorRef.current.innerHTML = value || "";
      lastHtml.current = value || "";
      setStats(calcStats(value || ""));
      setIsEmpty(!value);
    }
    setSourceHtml(value || "");
  }, [value]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }, []);

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
    restoreSelection();
  }, [restoreSelection]);

  const notifyChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    const normalized = (html === "<br>" || html === "<div><br></div>") ? "" : html;
    lastHtml.current = normalized;
    onChange?.(normalized);
    setStats(calcStats(normalized));
    setIsEmpty(!normalized);
  }, [onChange]);

  const exec = useCallback((cmd: string, val?: string) => {
    focusEditor();
    document.execCommand(cmd, false, val);
    notifyChange();
    updateActive();
  }, [focusEditor, notifyChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateActive = useCallback(() => {
    try {
      setActive({
        bold:                document.queryCommandState("bold"),
        italic:              document.queryCommandState("italic"),
        underline:           document.queryCommandState("underline"),
        strikeThrough:       document.queryCommandState("strikeThrough"),
        subscript:           document.queryCommandState("subscript"),
        superscript:         document.queryCommandState("superscript"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList:   document.queryCommandState("insertOrderedList"),
        justifyLeft:         document.queryCommandState("justifyLeft"),
        justifyCenter:       document.queryCommandState("justifyCenter"),
        justifyRight:        document.queryCommandState("justifyRight"),
        justifyFull:         document.queryCommandState("justifyFull"),
      });
    } catch { /* ignore */ }
  }, []);

  const handleInput = useCallback(() => { notifyChange(); }, [notifyChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    if      (e.key === "b")                { e.preventDefault(); exec("bold"); }
    else if (e.key === "i")                { e.preventDefault(); exec("italic"); }
    else if (e.key === "u")                { e.preventDefault(); exec("underline"); }
    else if (e.key === "z" && !e.shiftKey) { e.preventDefault(); exec("undo"); }
    else if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); exec("redo"); }
    else if (e.key === "k")                { e.preventDefault(); saveSelection(); setModal("link"); }
  }, [exec, saveSelection]);

  // ── Insert helpers ─────────────────────────────────────────────────────────
  const insertInlineCode = useCallback(() => {
    const sel = window.getSelection();
    const txt = sel?.toString() || "code";
    saveSelection(); focusEditor();
    document.execCommand("insertHTML", false, `<code>${txt}</code>`);
    notifyChange();
  }, [focusEditor, notifyChange, saveSelection]);

  const insertCodeBlock = useCallback(() => {
    const sel = window.getSelection();
    const txt = sel?.toString() || "// your code here";
    focusEditor();
    document.execCommand("insertHTML", false, `<pre><code>${txt}</code></pre><p><br></p>`);
    notifyChange(); setShowBlockMenu(false);
  }, [focusEditor, notifyChange]);

  const insertEduBlock = useCallback((block: typeof EDU_BLOCKS[0]) => {
    restoreSelection();
    focusEditor();
    document.execCommand("insertHTML", false,
      `<div class="${block.cls}"><strong>${block.emoji} ${block.title}</strong><p>Write your ${block.label.toLowerCase()} here...</p></div><p><br></p>`);
    notifyChange();
    setShowEduMenu(false);
  }, [restoreSelection, focusEditor, notifyChange]);

  const insertHR = useCallback(() => {
    focusEditor();
    document.execCommand("insertHTML", false, `<hr class="rte-hr"><p><br></p>`);
    notifyChange();
  }, [focusEditor, notifyChange]);

  const applyBlock = useCallback((tag: string) => {
    restoreSelection();
    focusEditor();
    if (tag === "pre") {
      insertCodeBlock();
      return;
    }
    try {
      document.execCommand("formatBlock", false, `<${tag}>`);
    } catch {
      try {
        document.execCommand("formatBlock", false, tag);
      } catch { /* ignore */ }
    }
    notifyChange();
    updateActive();
    setShowBlockMenu(false);
  }, [restoreSelection, focusEditor, insertCodeBlock, notifyChange, updateActive]);

  const applyColor = useCallback((color: string, type: "text" | "hl") => {
    restoreSelection();
    focusEditor();
    if (type === "text") {
      document.execCommand("foreColor", false, color);
    } else {
      if (color === "none") {
        document.execCommand("removeFormat", false, undefined);
      } else {
        try {
          document.execCommand("hiliteColor", false, color);
        } catch {
          document.execCommand("backColor", false, color);
        }
      }
    }
    notifyChange();
    setColorPicker(null);
  }, [restoreSelection, focusEditor, notifyChange]);

  const applyFont = useCallback((font: string) => {
    restoreSelection();
    focusEditor();
    if (font) {
      document.execCommand("fontName", false, font);
    }
    notifyChange();
    setShowFontMenu(false);
  }, [restoreSelection, focusEditor, notifyChange]);

  const applySize = useCallback((size: string) => {
    restoreSelection();
    focusEditor();
    document.execCommand("fontSize", false, size);
    notifyChange();
    setShowSizeMenu(false);
  }, [restoreSelection, focusEditor, notifyChange]);

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

  const handleModalInsert = useCallback((html: string) => {
    restoreSelection();
    focusEditor();
    document.execCommand("insertHTML", false, html);
    notifyChange();
    setModal(null);
  }, [restoreSelection, focusEditor, notifyChange]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActive);
    return () => document.removeEventListener("selectionchange", updateActive);
  }, [updateActive]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) return;
      closeAllMenus();
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [closeAllMenus]);

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

  // ── Shared dropdown-trigger style ──────────────────────────────────────────
  const dropTriggerCls = "flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer select-none flex-shrink-0";

  // ── TOOLBAR ────────────────────────────────────────────────────────────────

  const toolbar = !readOnly && (
    <div
      ref={toolbarRef}
      className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex-shrink-0"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Row 1: History | Block | Font | Size | Style | Color | Code | View | Fullscreen */}
      <div className={`relative border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-0.5 px-3 py-1.5 ${
        (showBlockMenu || showFontMenu || showSizeMenu || colorPicker) ? "z-50" : "z-20"
      }`}>

        <Tip tip="Undo" shortcut="Ctrl+Z"><TBtn onClick={() => exec("undo")}><Undo2 className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Redo" shortcut="Ctrl+Y"><TBtn onClick={() => exec("redo")}><Redo2 className="w-3.5 h-3.5" /></TBtn></Tip>
        <Sep />

        {/* Block Style */}
        <div className={`relative ${showBlockMenu ? "z-50" : "z-10"}`} onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Block Style">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowBlockMenu((b) => !b);
                setShowFontMenu(false);
                setShowSizeMenu(false);
                setShowEduMenu(false);
                setColorPicker(null);
              }}
              className={dropTriggerCls}
            >
              <span className="w-[84px] text-left truncate">{currentBlockLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
            </button>
          </Tip>
          {showBlockMenu && (
            <Dropdown onMouseDown={(e) => e.stopPropagation()}>
              {BLOCK_FORMATS.map(({ label, tag, Icon }) => (
                <DropItem
                  key={tag}
                  onClick={() => applyBlock(tag)}
                  active={currentBlockLabel === label}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{label}</span>
                </DropItem>
              ))}
            </Dropdown>
          )}
        </div>
        <Sep />

        {/* Font Family */}
        <div className={`relative ${showFontMenu ? "z-50" : "z-10"}`} onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Font Family">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowFontMenu((b) => !b);
                setShowBlockMenu(false);
                setShowSizeMenu(false);
                setShowEduMenu(false);
                setColorPicker(null);
              }}
              className={dropTriggerCls}
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

        {/* Font Size */}
        <div className={`relative ${showSizeMenu ? "z-50" : "z-10"}`} onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Font Size">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowSizeMenu((b) => !b);
                setShowBlockMenu(false);
                setShowFontMenu(false);
                setShowEduMenu(false);
                setColorPicker(null);
              }}
              className={dropTriggerCls}
            >
              <span>Size</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </Tip>
          {showSizeMenu && (
            <Dropdown onMouseDown={(e) => e.stopPropagation()}>
              {FONT_SIZES.map(({ label, value }) => (
                <DropItem key={value} onClick={() => applySize(value)}>
                  <span>{label}</span>
                </DropItem>
              ))}
            </Dropdown>
          )}
        </div>
        <Sep />

        {/* Text Style */}
        <Tip tip="Bold" shortcut="Ctrl+B"><TBtn onClick={() => exec("bold")} active={active.bold}><Bold className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Italic" shortcut="Ctrl+I"><TBtn onClick={() => exec("italic")} active={active.italic}><Italic className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Underline" shortcut="Ctrl+U"><TBtn onClick={() => exec("underline")} active={active.underline}><Underline className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Strikethrough"><TBtn onClick={() => exec("strikeThrough")} active={active.strikeThrough}><Strikethrough className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Subscript"><TBtn onClick={() => exec("subscript")} active={active.subscript}><Subscript className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Superscript"><TBtn onClick={() => exec("superscript")} active={active.superscript}><Superscript className="w-3.5 h-3.5" /></TBtn></Tip>
        <Sep />

        {/* Colors */}
        <div className={`relative ${colorPicker === "text" ? "z-50" : "z-10"}`} onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Text Color">
            <TBtn onClick={() => {
              saveSelection();
              setColorPicker((p) => p === "text" ? null : "text");
              setShowBlockMenu(false);
              setShowFontMenu(false);
              setShowSizeMenu(false);
              setShowEduMenu(false);
            }}>
              <Palette className="w-3.5 h-3.5" />
            </TBtn>
          </Tip>
          {colorPicker === "text" && (
            <ColorPanel
              colors={TEXT_COLORS}
              title="Text Color"
              onSelect={(c) => applyColor(c, "text")}
              onClose={() => setColorPicker(null)}
            />
          )}
        </div>
        <div className={`relative ${colorPicker === "hl" ? "z-50" : "z-10"}`} onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Highlight">
            <TBtn onClick={() => {
              saveSelection();
              setColorPicker((p) => p === "hl" ? null : "hl");
              setShowBlockMenu(false);
              setShowFontMenu(false);
              setShowSizeMenu(false);
              setShowEduMenu(false);
            }}>
              <Highlighter className="w-3.5 h-3.5" />
            </TBtn>
          </Tip>
          {colorPicker === "hl" && (
            <ColorPanel
              colors={HIGHLIGHT_COLORS}
              title="Highlight Color"
              onSelect={(c) => applyColor(c, "hl")}
              onClose={() => setColorPicker(null)}
            />
          )}
        </div>
        <Sep />

        {/* Inline Code */}
        <Tip tip="Inline Code"><TBtn onClick={insertInlineCode}><Code className="w-3.5 h-3.5" /></TBtn></Tip>
        <Sep />

        {/* View Mode */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex-shrink-0">
          {([
            { mode: "edit" as const, Icon: SquarePen, tip: "Edit" },
            { mode: "preview" as const, Icon: Eye, tip: "Preview" },
            { mode: "source" as const, Icon: FileCode2, tip: "Source" },
          ]).map(({ mode, Icon, tip: t }) => (
            <Tip key={mode} tip={t}>
              <TBtn onClick={() => switchMode(mode)} active={viewMode === mode}
                className={viewMode === mode ? "bg-white dark:bg-slate-700 shadow-sm !text-blue-600 dark:!text-blue-400" : ""}>
                <Icon className="w-3.5 h-3.5" />
              </TBtn>
            </Tip>
          ))}
        </div>

        {/* Fullscreen */}
        <Tip tip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          <TBtn onClick={() => setIsFullscreen((f) => !f)}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </TBtn>
        </Tip>
      </div>

      {/* ── Row 2: Align | Lists+Indent | Insert | Edu Blocks | Clear */}
      <div className={`relative flex flex-wrap items-center gap-0.5 px-3 py-1.5 ${
        showEduMenu ? "z-50" : "z-10"
      }`}>

        {/* Alignment */}
        <Tip tip="Align Left"><TBtn onClick={() => exec("justifyLeft")} active={active.justifyLeft}><AlignLeft className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Align Center"><TBtn onClick={() => exec("justifyCenter")} active={active.justifyCenter}><AlignCenter className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Align Right"><TBtn onClick={() => exec("justifyRight")} active={active.justifyRight}><AlignRight className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Justify"><TBtn onClick={() => exec("justifyFull")} active={active.justifyFull}><AlignJustify className="w-3.5 h-3.5" /></TBtn></Tip>
        <Sep />

        {/* Lists & Indent */}
        <Tip tip="Bulleted List"><TBtn onClick={() => exec("insertUnorderedList")} active={active.insertUnorderedList}><List className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Numbered List"><TBtn onClick={() => exec("insertOrderedList")} active={active.insertOrderedList}><ListOrdered className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Increase Indent"><TBtn onClick={() => exec("indent")}><Indent className="w-3.5 h-3.5" /></TBtn></Tip>
        <Tip tip="Decrease Indent"><TBtn onClick={() => exec("outdent")}><Outdent className="w-3.5 h-3.5" /></TBtn></Tip>
        <Sep />

        {/* Insert */}
        <Tip tip="Insert Link" shortcut="Ctrl+K">
          <TBtn onClick={() => { saveSelection(); setModal("link"); }}><Link2 className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Insert Image">
          <TBtn onClick={() => { saveSelection(); setModal("image"); }}><ImageIcon className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Insert Table">
          <TBtn onClick={() => { saveSelection(); setModal("table"); }}><Table2 className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Tip tip="Insert Horizontal Separator">
          <TBtn onClick={insertHR}><Minus className="w-3.5 h-3.5" /></TBtn>
        </Tip>
        <Sep />

        {/* Educational Blocks */}
        <div className={`relative ${showEduMenu ? "z-50" : "z-10"}`} onMouseDown={(e) => e.stopPropagation()}>
          <Tip tip="Insert Educational Block">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowEduMenu((b) => !b);
                setShowBlockMenu(false);
                setShowFontMenu(false);
                setShowSizeMenu(false);
                setColorPicker(null);
              }}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-800 transition-all cursor-pointer select-none flex-shrink-0"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Block</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </Tip>
          {showEduMenu && (
            <Dropdown onMouseDown={(e) => e.stopPropagation()} className="min-w-[210px]">
              <div className="px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Educational Blocks</span>
              </div>
              {EDU_BLOCKS.map((block) => (
                <DropItem key={block.cls} onClick={() => insertEduBlock(block)}>
                  <span className="text-base leading-none">{block.emoji}</span>
                  <span>{block.label}</span>
                </DropItem>
              ))}
            </Dropdown>
          )}
        </div>
        <Sep />

        {/* Clear Formatting */}
        <Tip tip="Clear Formatting"><TBtn onClick={() => exec("removeFormat")}><Eraser className="w-3.5 h-3.5" /></TBtn></Tip>
      </div>
    </div>
  );

  // ── EDITING SURFACE ────────────────────────────────────────────────────────

  const surface = (
    <div className="relative flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950" style={{ minHeight }}>

      {/* Document canvas - Edit */}
      {viewMode === "edit" && (
        <div className="mx-auto my-6 max-w-3xl px-4">
          <div className="bg-white dark:bg-slate-900 shadow-lg rounded-xl relative">
            <div
              ref={editorRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onMouseUp={updateActive}
              onKeyUp={updateActive}
              onFocus={updateActive}
              className="rte-content w-full outline-none px-10 py-8 text-slate-900 dark:text-slate-100"
              style={{ minHeight: minHeight - 80 }}
            />
            {isEmpty && !readOnly && (
              <div className="absolute top-8 left-10 text-slate-300 dark:text-slate-700 pointer-events-none select-none" aria-hidden>
                <p className="font-extrabold text-2xl mb-2">Lesson Title</p>
                <p className="text-sm font-normal">{placeholder}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document canvas - Preview */}
      {viewMode === "preview" && (
        <div className="mx-auto my-6 max-w-3xl px-4">
          <div className="bg-white dark:bg-slate-900 shadow-lg rounded-xl">
            <div
              className="rte-content w-full px-10 py-8 text-slate-900 dark:text-slate-100"
              dangerouslySetInnerHTML={{ __html: lastHtml.current || `<p class="rte-placeholder">${placeholder}</p>` }}
            />
          </div>
        </div>
      )}

      {/* Source */}
      {viewMode === "source" && (
        <textarea
          value={sourceHtml}
          onChange={(e) => { const v = e.target.value; setSourceHtml(v); lastHtml.current = v; onChange?.(v); }}
          spellCheck={false}
          className="w-full bg-slate-950 text-emerald-400 font-mono text-xs px-8 py-6 outline-none resize-none"
          style={{ minHeight }}
        />
      )}
    </div>
  );

  // ── STATS BAR ───────────────────────────────────────────────────────

  const statsBar = (
    <div className="flex items-center gap-4 px-5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
      <span><span className="font-bold text-slate-700 dark:text-slate-300">{stats.chars.toLocaleString()}</span> chars</span>
      <span><span className="font-bold text-slate-700 dark:text-slate-300">{stats.words.toLocaleString()}</span> words</span>
      <span><span className="font-bold text-slate-700 dark:text-slate-300">{stats.readTime}</span> min read</span>
      <span><span className="font-bold text-slate-700 dark:text-slate-300">{stats.blocks}</span> blocks</span>
      <div className="hidden sm:flex items-center gap-1 text-slate-400 dark:text-slate-600">
        <BookOpen className="w-3 h-3" />
        <span>Ctrl+K = link · Ctrl+Z/Y = undo/redo</span>
      </div>
      <div className="flex-1" />
      <span className={["font-semibold uppercase tracking-wider text-[10px]",
        viewMode === "edit" ? "text-blue-500" : viewMode === "preview" ? "text-violet-500" : "text-emerald-500"].join(" ")}>
        {viewMode === "edit" ? "✏ Editing" : viewMode === "preview" ? "👁 Preview" : "</> Source"}
      </span>
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <>
      {modal && <InsertModal type={modal} onClose={() => setModal(null)} onInsert={handleModalInsert} />}
      <div className={["flex flex-col border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-sm",
        isFullscreen ? "fixed inset-0 z-[9990] rounded-none border-none shadow-none" : ""].join(" ")}>
        {toolbar}
        {surface}
        {!readOnly && statsBar}
      </div>
    </>
  );
}
