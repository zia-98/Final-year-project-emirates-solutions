import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatbotProps {
  type?: "public" | "admin";
}

const GEMINI_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemma-3-4b-it",
] as const;

const shouldRetryNextModel = (status: number, body: string) => {
  const lower = body.toLowerCase();
  const hasInvalidKey = lower.includes("api_key_invalid") || lower.includes("api key expired") || lower.includes("api key invalid");
  if (hasInvalidKey) return false;
  return (
    status === 429 ||
    status === 404 ||
    status === 400 ||
    lower.includes("resource_exhausted") ||
    lower.includes("rate limit") ||
    lower.includes("quota") ||
    lower.includes("not found") ||
    lower.includes("model")
  );
};

const AIChatbot = ({ type = "public" }: AIChatbotProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! 👋 I'm your AI assistant from Emirates Solutions. How can I help you today? I can answer questions about our services, internships, products, and more!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const streamChat = async (userMessage: string) => {
    const COMPANY_KNOWLEDGE_BASE = `
You are the AI Assistant for Emirates Solutions, an IT solutions company based in Ratnagiri, Maharashtra, India.

COMPANY INFORMATION:
- Name: Emirates Solutions
- Owner: Talha Gadbade
- Location: Udyam Nagar Rd, Patwardhan Wadi, Ratnagiri, Maharashtra 415639, India
- Phone: +91 79722 81583
- Email: info@esrtn.in
- Founded: 2015

SERVICES OFFERED:
1. Hardware Sales - Laptops, desktops, peripherals, networking equipment
2. Software Licensing - Microsoft, Adobe, antivirus solutions
3. IT Products - Complete range of IT accessories and components
4. Web Development - Custom websites, web applications
5. Annual Maintenance Contracts (AMC) - IT support and maintenance
6. Internships - Paid, unpaid, and stipend-based programs in:
   - Web Development (React, Node.js, Python)
   - Mobile App Development (Flutter, React Native)
   - Data Science & AI/ML
   - Cloud Computing (AWS, Azure)
   - Cybersecurity
   - Digital Marketing
   - UI/UX Design

INTERNSHIP DETAILS:
- Duration: 1-6 months
- Types: Paid, Unpaid, Stipend-based, Free
- Benefits: Certificate, Letter of Recommendation, Project Experience
- Domains: IT, Software Development, Data Science, Cloud, Security

OFFICE HOURS:
- Monday - Friday: 9:00 AM - 6:00 PM
- Saturday: 10:00 AM - 4:00 PM
- Sunday: Closed

GUIDELINES:
- Be helpful, professional, and friendly
- Answer questions about services, internships, products
- Guide users to appropriate pages on the website
- If unsure, suggest contacting support
- Currency is INR (₹)
- All prices are in Indian Rupees
`;

    const systemPrompt = type === "admin"
      ? `${COMPANY_KNOWLEDGE_BASE}\n\nYou are assisting an ADMIN user. Provide detailed technical information and administrative guidance.`
      : `${COMPANY_KNOWLEDGE_BASE}\n\nYou are assisting a student or general user. Be helpful and guide them through services, internships, and products.`;

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
      if (!API_KEY) throw new Error("API key not configured");

      const payloadMessages = newMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const payload = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: payloadMessages
      };

      let resp: Response | null = null;
      let lastErrorText = "";
      for (const modelName of GEMINI_MODEL_CANDIDATES) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${API_KEY}`;
        const candidateResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (candidateResponse.ok) {
          resp = candidateResponse;
          break;
        }

        const errorText = await candidateResponse.text();
        lastErrorText = errorText;
        if (errorText.toLowerCase().includes("api_key_invalid") || errorText.toLowerCase().includes("api key expired") || errorText.toLowerCase().includes("api key invalid")) {
          throw new Error("Gemini API key is expired or invalid. Please renew the key in your environment variables.");
        }
        if (shouldRetryNextModel(candidateResponse.status, errorText)) {
          console.warn(`Chat model '${modelName}' failed (${candidateResponse.status}), trying next fallback model.`);
          continue;
        }

        throw new Error(`Failed to connect to AI assistant (${candidateResponse.status})${errorText ? `: ${errorText}` : ""}`);
      }

      if (!resp) {
        throw new Error(lastErrorText.toLowerCase().includes("api_key_invalid") || lastErrorText.toLowerCase().includes("api key expired")
          ? "Gemini API key is expired or invalid. Please renew the key in your environment variables."
          : `Failed to connect to AI assistant (all fallback models failed). ${lastErrorText}`);
      }

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to connect to AI assistant");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: "assistant", content: assistantContent };
                return newMsgs;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment or contact us directly at +91 79722 81583." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    streamChat(userMessage);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full gradient-primary shadow-glow z-50 p-0"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-background border rounded-2xl shadow-2xl transition-all duration-300",
        isMinimized ? "w-80 h-14" : "w-96 h-[500px] max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Emirates Solutions</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-0" />
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="gradient-primary"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default AIChatbot;
