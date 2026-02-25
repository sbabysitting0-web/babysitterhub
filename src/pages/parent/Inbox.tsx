import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, User, MessageCircle } from "lucide-react";
import newLogo from "@/assets/new logo.png";

const TEAL  = "#3DBEB5";
const BG    = "#080F0D";
const CARD  = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

interface Message {
  id: string; sender_id: string; receiver_id: string;
  text: string; is_read: boolean | null; created_at: string;
}
interface Contact { user_id: string; name: string; lastMessage?: string; }

const Inbox = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get("with");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const loadContacts = async () => {
      const { data } = await supabase.from("messages").select("sender_id, receiver_id, text, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false });
      if (!data) return;
      const contactIds = [...new Set(data.map((m) => m.sender_id === user.id ? m.receiver_id : m.sender_id))];
      const [bsRes, parentRes] = await Promise.all([
        supabase.from("babysitter_profiles").select("user_id, name").in("user_id", contactIds),
        supabase.from("parent_profiles").select("user_id, name").in("user_id", contactIds),
      ]);
      const nameMap: Record<string, string> = {};
      bsRes.data?.forEach((p) => { nameMap[p.user_id] = p.name; });
      parentRes.data?.forEach((p) => { nameMap[p.user_id] = p.name; });
      const contactList: Contact[] = contactIds.map((cid) => ({
        user_id: cid, name: nameMap[cid] ?? "User",
        lastMessage: data.find((m) => m.sender_id === cid || m.receiver_id === cid)?.text,
      }));
      if (withUserId && !contactIds.includes(withUserId)) {
        const { data: sd } = await supabase.from("babysitter_profiles").select("user_id, name").eq("user_id", withUserId).maybeSingle();
        const { data: pd } = await supabase.from("parent_profiles").select("user_id, name").eq("user_id", withUserId).maybeSingle();
        contactList.unshift({ user_id: withUserId, name: sd?.name ?? pd?.name ?? "User" });
      }
      setContacts(contactList);
      if (withUserId) { const f = contactList.find((c) => c.user_id === withUserId); if (f) setActiveContact(f); }
      else if (contactList.length > 0) setActiveContact(contactList[0]);
    };
    loadContacts();
  }, [user, withUserId]);

  useEffect(() => {
    if (!user || !activeContact) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeContact.user_id}),and(sender_id.eq.${activeContact.user_id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
      await supabase.from("messages").update({ is_read: true }).eq("receiver_id", user.id).eq("sender_id", activeContact.user_id);
    };
    fetchMessages();
    const channel = supabase.channel(`messages-${activeContact.user_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === activeContact.user_id) setMessages((prev) => [...prev, msg]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeContact]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeContact || !newMessage.trim()) return;
    setSending(true);
    const optimistic: Message = { id: Date.now().toString(), sender_id: user.id, receiver_id: activeContact.user_id, text: newMessage.trim(), is_read: false, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: activeContact.user_id, text: optimistic.text });
    setSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      {/* Topbar */}
      <header className="sticky top-0 z-30" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-3 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={newLogo} alt="Logo" className="h-6 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="font-heading font-bold text-white text-sm">BabySitter<span style={{ color: TEAL }}>Hub</span></span>
          </Link>
          <span className="text-white/20 mx-1">/</span>
          <h1 className="text-sm font-semibold text-white/60">Messages</h1>
        </div>
      </header>

      <div className="container flex-1 flex flex-col max-w-5xl py-6">
        <div className="flex flex-1 rounded-2xl overflow-hidden" style={{ minHeight: 500, background: CARD, border: `1px solid ${BORDER}` }}>
          {/* Contact list */}
          <div className="w-64 flex flex-col shrink-0" style={{ borderRight: `1px solid ${BORDER}` }}>
            <div className="p-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No conversations yet</p>
                </div>
              ) : contacts.map((contact) => {
                const isActive = activeContact?.user_id === contact.user_id;
                return (
                  <button key={contact.user_id} onClick={() => setActiveContact(contact)} className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                    style={{ background: isActive ? "rgba(61,190,181,0.08)" : "transparent", borderLeft: isActive ? `2px solid ${TEAL}` : "2px solid transparent" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(61,190,181,0.12)" }}>
                      <User size={16} style={{ color: TEAL }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{contact.name}</p>
                      {contact.lastMessage && <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{contact.lastMessage}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeContact ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(61,190,181,0.12)" }}><User size={16} style={{ color: TEAL }} /></div>
                  <span className="font-heading font-semibold text-white">{activeContact.name}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Start the conversation with {activeContact.name}</p>
                    </div>
                  ) : messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm" style={{
                          background: isMine ? TEAL : "rgba(255,255,255,0.07)",
                          color: isMine ? "#fff" : "rgba(255,255,255,0.85)",
                          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        }}>
                          <p>{msg.text}</p>
                          <p className="text-[10px] mt-1" style={{ color: isMine ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }}>
                            {new Date(msg.created_at).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 flex gap-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`Message ${activeContact.name}...`} disabled={sending}
                    className="flex-1 rounded-full px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#3DBEB5] transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff" }} />
                  <button type="submit" disabled={sending || !newMessage.trim()} className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-40" style={{ background: TEAL }}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col gap-3">
                <MessageCircle className="w-12 h-12" style={{ color: "rgba(255,255,255,0.1)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
