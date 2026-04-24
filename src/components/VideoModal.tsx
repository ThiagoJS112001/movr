import { X } from 'lucide-react';

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;

    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1).split('?')[0];
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') {
        videoId = u.searchParams.get('v');
      } else if (u.pathname.startsWith('/embed/')) {
        return url; // already an embed URL
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/')[2];
      }
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  } catch {
    return null;
  }
}

interface VideoModalProps {
  url: string;
  onClose: () => void;
}

export default function VideoModal({ url, onClose }: VideoModalProps) {
  const embedUrl = getYouTubeEmbedUrl(url);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors"
          aria-label="Fechar vídeo"
        >
          <X size={24} />
        </button>

        {embedUrl ? (
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Vídeo demonstrativo"
            />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <p className="text-white mb-4">Não foi possível incorporar este vídeo.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 underline"
            >
              Abrir no YouTube
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
