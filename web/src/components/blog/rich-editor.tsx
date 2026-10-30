"use client";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Megaphone, Quote, Redo2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { blogImageUploadUrl } from "@/server/blog-actions";
import "./blog.css";

/** Caja destacada («Plazo: 30 de junio»). Se guarda como <aside data-callout>, que el blog pinta con el color del estilo. */
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,
  parseHTML: () => [{ tag: "aside[data-callout]" }],
  renderHTML: ({ HTMLAttributes }) => ["aside", mergeAttributes(HTMLAttributes, { "data-callout": "true" }), 0],
});

// Solo formato de estructura: sin colores, fuentes ni tamaños. Lo que se pega de Word o de una web pierde su estilo
// porque el editor no tiene dónde guardarlo.
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false, codeBlock: false, strike: false, underline: false, horizontalRule: false,
    link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
  }),
  Image.configure({ inline: false, allowBase64: false }),
  Callout,
];

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Sube una imagen al bucket del blog y devuelve su ruta y su URL pública. */
export async function uploadBlogImage(file: File): Promise<{ path: string; url: string }> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("La imagen debe ser JPG, PNG o WebP.");
  if (file.size > 5 * 1024 * 1024) throw new Error("La imagen pesa más de 5 MB.");
  const r = await blogImageUploadUrl({ name: file.name, mime: file.type, sizeBytes: file.size });
  if (!r.ok) throw new Error(r.error);
  const { error } = await supabaseBrowser().storage.from("blog").uploadToSignedUrl(r.data.path, r.data.token, file, { contentType: file.type });
  if (error) throw new Error("No hemos podido subir la imagen. Inténtalo de nuevo.");
  return { path: r.data.path, url: r.data.url };
}

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // no quitar el foco ni la selección del texto
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-md transition-colors disabled:opacity-40 ${active ? "bg-ink text-on-ink" : "text-ink hover:bg-accent-soft"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onError }: { editor: Editor; onError: (msg: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }), h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"), italic: e.isActive("italic"), link: e.isActive("link"),
      ul: e.isActive("bulletList"), ol: e.isActive("orderedList"), quote: e.isActive("blockquote"), callout: e.isActive("callout"),
      undo: e.can().undo(), redo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  function link() {
    if (s.link) return c().extendMarkRange("link").unsetLink().run();
    const url = window.prompt("Dirección del enlace (por ejemplo, https://sede.agenciatributaria.gob.es)");
    if (url?.trim()) c().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  async function image(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadBlogImage(file);
      const alt = window.prompt("Describe la imagen en pocas palabras (para quien no puede verla)") ?? "";
      c().setImage({ src: url, alt: alt.trim() }).run();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div role="toolbar" aria-label="Formato" className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-surface-raised/95 p-2 backdrop-blur">
      <ToolButton label="Título" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className="size-5" /></ToolButton>
      <ToolButton label="Subtítulo" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className="size-5" /></ToolButton>
      <span aria-hidden className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Negrita" active={s.bold} onClick={() => c().toggleBold().run()}><Bold className="size-4" /></ToolButton>
      <ToolButton label="Cursiva" active={s.italic} onClick={() => c().toggleItalic().run()}><Italic className="size-4" /></ToolButton>
      <ToolButton label={s.link ? "Quitar enlace" : "Enlace"} active={s.link} onClick={link}><Link2 className="size-4" /></ToolButton>
      <span aria-hidden className="mx-1 h-6 w-px bg-border" />
      <ToolButton label="Lista" active={s.ul} onClick={() => c().toggleBulletList().run()}><List className="size-4" /></ToolButton>
      <ToolButton label="Lista numerada" active={s.ol} onClick={() => c().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolButton>
      <ToolButton label="Cita" active={s.quote} onClick={() => c().toggleBlockquote().run()}><Quote className="size-4" /></ToolButton>
      <ToolButton label="Caja destacada" active={s.callout} onClick={() => c().toggleWrap("callout").run()}><Megaphone className="size-4" /></ToolButton>
      <ToolButton label={uploading ? "Subiendo imagen…" : "Imagen"} disabled={uploading} onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" /></ToolButton>
      <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => image(e.target.files?.[0])} />
      <span className="ml-auto flex gap-1">
        <ToolButton label="Deshacer" disabled={!s.undo} onClick={() => c().undo().run()}><Undo2 className="size-4" /></ToolButton>
        <ToolButton label="Rehacer" disabled={!s.redo} onClick={() => c().redo().run()}><Redo2 className="size-4" /></ToolButton>
      </span>
    </div>
  );
}

/** Editor visual del cuerpo del post. Se pinta con las mismas reglas que el post publicado (.post-body). */
export function RichEditor({ initialHtml, onChange, editable = true, onError }: { initialHtml: string; onChange: (html: string) => void; editable?: boolean; onError: (msg: string) => void }) {
  const editor = useEditor({
    extensions,
    content: initialHtml,
    editable,
    immediatelyRender: false,
    editorProps: { attributes: { class: "post-body min-h-[50vh] px-5 py-6 outline-none sm:px-8", "aria-label": "Texto del post", role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });
  useEffect(() => { editor?.setEditable(editable, false); }, [editor, editable]);
  return (
    <div className="post overflow-hidden rounded-[20px] border border-border-input bg-bg focus-within:border-accent">
      {editor && editable && <Toolbar editor={editor} onError={onError} />}
      <EditorContent editor={editor} />
    </div>
  );
}
