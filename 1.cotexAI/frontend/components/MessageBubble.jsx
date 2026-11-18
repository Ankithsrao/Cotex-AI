import { Check, Copy, Download, ExternalLink, X } from "lucide-react"
import { useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const isBlockedThumbnail = (image) =>
  /^https?:\/\/(?:[\w-]+\.)?timeanddate\.com\/scripts\/cityog\.php(?:[?#]|$)/i.test(image)

const ImageResult = ({ image, index, onClick }) => {
  const [failed, setFailed] = useState(false)
  const [downloadError, setDownloadError] = useState("")

  const downloadImage = async (event) => {
    event.stopPropagation()
    setDownloadError("")

    try {
      const response = await fetch(image)
      if (!response.ok) {
        throw new Error(`Image download failed (${response.status})`)
      }

      const blob = await response.blob()
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif"
      }[blob.type] || "png"
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `image-${index + 1}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      setDownloadError(error.message || "Unable to download image")
    }
  }

  return (
    <div className="group relative h-28 w-40">
      <button
        type="button"
        onClick={onClick}
        className="block h-full w-full overflow-hidden rounded-xl border border-white/10 text-left"
        aria-label={`View search result image ${index + 1}`}
      >
        {failed ? (
          <span className="flex h-full items-center justify-center bg-white/5 px-3 text-center text-xs text-slate-400">
            Image unavailable
          </span>
        ) : (
          <img
            src={image}
            alt={`Search result ${index + 1}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition hover:opacity-90"
          />
        )}
      </button>
      {!failed && (
        <button
          type="button"
          onClick={downloadImage}
          aria-label={`Download image ${index + 1}`}
          title="Download image"
          className="absolute right-2 top-2 rounded-lg bg-black/40 p-2 text-white opacity-100 backdrop-blur-md transition hover:bg-indigo-500/70 md:opacity-0 md:group-hover:opacity-100"
        >
          <Download size={16} />
        </button>
      )}
      {downloadError && (
        <span role="alert" className="absolute left-0 top-full mt-1 text-xs text-red-300">
          {downloadError}
        </span>
      )}
    </div>
  )
}

const MessageBubble = ({ role, content, images = [] }) => {
  const isUser = role === "user"
  const [lightBox, setLightBox] = useState(null)
  const [copiedCode, setCopiedCode] = useState()

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode("")
    }, 2000)
  }
  const displayContent = role === "assistant" && typeof content === "string"
    ? content.replace(/【\d+†[^】]*】/g, "")
    : content
  const visibleImages = images.filter(image => !isBlockedThumbnail(image))
  return (
    <>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`w-fit max-w-[92vw] overflow-hidden wrap-break-words rounded-2xl px-4 py-2.5 leading-relaxed md:max-w-[72%]
          ${isUser
            ? "bg-linear-to-br from-indigo-500 to-violet-700 text-white rounded-tr-sm"
            : "text-slate-200 rounded-tl-sm"
          }`}
        >
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 text-2xl font-bold ">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold mt-3 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 whitespace-pre-wrap wrap-break-words">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border border-white/10">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-white/10 bg-white/5 px-3 py-2 text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-white/10 px-3 py-2">{children}</td>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="nonreferrer"
                  className="text-indigo-400 underline inline-flex items-center gap-1"
                >
                  {children}
                  <ExternalLink size={14} />
                </a>
              ),
              code: ({ className, children, ...props }) => {
                const value = String(children).trim();

                if (!className) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-200" {...props}>
                      {value}
                    </code>
                  );
                }

                const language =
                  typeof className === "string"
                    ? className.replace("language-", "")
                    : "";

                return (
                  <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
                    <div className="flex items-center justify-between bg-[#1b1d24] border-b border-white/10 px-4 py-2">
                      <span className="uppercase text-xs text-slate-400">
                        {language}
                      </span>
                      <button className='flex items-center gap-1 text-xs' onClick={() => copyCode(value)}>
                        {
                          copiedCode === value ?
                            <>
                              <Check size={14} />
                              Copied
                            </> :
                            <><Copy size={14} />Copy</>
                        }
                      </button>
                    </div>

                    <SyntaxHighlighter
                      language={language}
                      style={oneDark}
                      wrapLongLines
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        padding: "16px",
                        background: "#0d1117",
                        fontSize: "13px"
                      }}
                    >
                      {value}
                    </SyntaxHighlighter>
                  </div>
                );
              },

              img: ({ src }) => {
                if (!src) return null;
                return (
                  <img
                    src={src}
                    onClick={()=>setLightBox(src)}
                    loading="lazy"
                    onError={(e) => e.currentTarget.remove()}
                    className="h-full w-full object-cover transition hover:opacity-90"
                  />
                )
              }
            }}
          >
            {displayContent}
          </Markdown>
          {visibleImages.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {visibleImages.map((image, index) => (
                <ImageResult
                  key={`${image}-${index}`}
                  image={image}
                  index={index}
                  onClick={() => setLightBox(image)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {lightBox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          onClick={() => setLightBox(null)}
        >
          <button
            type="button"
            onClick={() => setLightBox(null)}
            aria-label="Close image preview"
            className="absolute right-5 top-5 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            <X />
          </button>
          <img
            src={lightBox}
            alt="Expanded search result"
            onClick={event => event.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  )
}

export default MessageBubble
