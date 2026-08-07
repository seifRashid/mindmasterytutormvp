import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth";

export default async function ContactPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar user={session} />

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Contact Us
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            We&apos;re Here to Help
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Have questions about student accounts, teacher registration, or curriculum setups? Send us a message!
          </p>
        </div>

        <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-2xl mx-auto space-y-6">
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name</label>
              <input
                type="text"
                placeholder="David Kim"
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Email</label>
              <input
                type="email"
                placeholder="david@example.com"
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message</label>
              <textarea
                rows={4}
                placeholder="How can we assist you today?"
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        © 2026 Mind Mastery Tutor Learning Portal
      </footer>
    </div>
  );
}
