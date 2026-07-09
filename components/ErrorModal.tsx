"use client";

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
