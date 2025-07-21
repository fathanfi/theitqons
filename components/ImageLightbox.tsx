'use client';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function ImageLightbox({ isOpen, imageUrl, onClose }: ImageLightboxProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt="Payment proof"
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
} 