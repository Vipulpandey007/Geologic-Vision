"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

export default function PdfViewerPage() {
  const { id: courseId, pdfId } = useParams();
  const { user, isReady } = useAuth(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfInfo, setPdfInfo] = useState(null);
  const [watermark, setWatermark] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rendering, setRendering] = useState(false);

  // Only load after auth is ready
  useEffect(() => {
    if (!isReady) return;
    loadPdf();
  }, [isReady, pdfId]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, scale]);

  // Disable right-click and print shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["p", "s", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        toast.error("Saving and printing is disabled.");
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function loadPdf() {
    try {
      setLoading(true);
      setError("");

      // Step 1 — get signed URL from backend
      const { data } = await api.get(`/pdfs/${pdfId}/view`);
      setPdfInfo(data.pdf);
      setWatermark(data.watermark);

      // Step 2 — fetch PDF as ArrayBuffer via our backend proxy
      // This avoids CORS issues with direct Supabase signed URLs
      const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL}/pdfs/${pdfId}/proxy`;
      const token = document.cookie.match(/accessToken=([^;]+)/)?.[1];

      const pdfResponse = await fetch(proxyUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!pdfResponse.ok) {
        throw new Error("Failed to fetch PDF content");
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();

      // Step 3 — load with PDF.js from buffer (no CORS issue)
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const doc = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error("PDF load error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load PDF. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const renderPage = useCallback(
    async (pageNum) => {
      if (!pdfDoc || !canvasRef.current) return;
      if (renderTaskRef.current) {
        try {
          await renderTaskRef.current.cancel();
        } catch {}
      }
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
        await renderTaskRef.current.promise;
        if (watermark)
          drawWatermark(ctx, viewport.width, viewport.height, watermark.text);
      } catch (err) {
        if (err?.name !== "RenderingCancelledException")
          console.error("Render error:", err);
      } finally {
        setRendering(false);
      }
    },
    [pdfDoc, scale, watermark],
  );

  function drawWatermark(ctx, width, height, text) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#1a1a2e";
    ctx.font = `bold ${Math.max(14, width / 25)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6);
    const stepX = width * 0.6;
    const stepY = height * 0.25;
    for (let y = -height; y < height * 1.5; y += stepY) {
      for (let x = -width; x < width * 1.5; x += stepX) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
  }

  function changePage(delta) {
    const next = currentPage + delta;
    if (next >= 1 && next <= totalPages) setCurrentPage(next);
  }

  function changeScale(delta) {
    setScale((s) =>
      Math.max(0.5, Math.min(3, parseFloat((s + delta).toFixed(1)))),
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-900 flex flex-col select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 h-14 flex items-center gap-3 flex-shrink-0">
        <Link
          href={`/course/${courseId}`}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="w-px h-5 bg-gray-700" />
        <BookOpen className="w-4 h-4 text-brand-400" />
        <span className="text-white text-sm font-medium truncate flex-1">
          {pdfInfo?.title || "Loading..."}
        </span>

        {totalPages > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => changePage(-1)}
              disabled={currentPage <= 1}
              className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-300 text-sm tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={currentPage >= totalPages}
              className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30 flex items-center justify-center text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => changeScale(-0.2)}
            className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-gray-300 text-xs w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => changeScale(0.2)}
            className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-6 pdf-viewer-container">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
            <p className="text-sm">Loading secure PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-white font-medium mb-2">Failed to load PDF</p>
            <p className="text-gray-400 text-sm mb-5">{error}</p>
            <button
              onClick={loadPdf}
              className="flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="relative shadow-2xl">
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30 rounded z-10">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="max-w-full block rounded"
              style={{ pointerEvents: "none" }}
            />
          </div>
        )}
      </div>

      {/* Mobile page nav */}
      {totalPages > 1 && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 flex items-center justify-center gap-4 md:hidden">
          <button
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1}
            className="btn-secondary py-1.5 px-3 text-xs bg-gray-700 border-gray-600 text-white"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-gray-300 text-sm">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={currentPage >= totalPages}
            className="btn-secondary py-1.5 px-3 text-xs bg-gray-700 border-gray-600 text-white"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
