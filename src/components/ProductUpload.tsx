import React, { useState, useRef } from 'react';

interface ProductUploadProps {
    onProductContext: (context: string) => void;
    productContext: string;
}

export function ProductUpload({ onProductContext, productContext }: ProductUploadProps) {
    const [mode, setMode] = useState<'url' | 'text' | 'file'>('url');
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUrlSubmit = async () => {
        if (!url.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            // For URL, we'll just store it and let the AI know about it
            // Full URL scraping would require server-side implementation
            const context = `Product Website: ${url}\n\nNote: The sales rep is selling a product/service from this website. Tailor your objections and questions accordingly.`;
            onProductContext(context);
            setUrl('');
        } catch (e) {
            setError('Could not process URL');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTextSubmit = () => {
        if (!text.trim()) return;
        onProductContext(text);
        setText('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError('');
        setFileName(file.name);

        try {
            if (file.type === 'application/pdf') {
                // For PDF, we'll read as base64 and include a note
                // Full PDF parsing would require a library like pdf.js
                const context = `[PDF Document: ${file.name}]\n\nNote: The sales rep is selling based on the contents of this PDF document. Please ask relevant questions about the product/service.`;
                onProductContext(context);
            } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                // Text files - read directly
                const text = await file.text();
                const context = `Product Information:\n${text.slice(0, 5000)}`; // Limit to 5000 chars
                onProductContext(context);
            } else {
                setError('Please upload a PDF or text file');
            }
        } catch (e) {
            setError('Could not read file');
        } finally {
            setIsLoading(false);
        }
    };

    const clearContext = () => {
        onProductContext('');
        setFileName('');
        setUrl('');
        setText('');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-cyan-600/20 text-cyan-400 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Optional</span>
                <h3 className="font-semibold text-lg">Product Context</h3>
            </div>

            {productContext ? (
                // Show current context summary
                <div className="p-4 bg-cyan-900/20 border border-cyan-500/50 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-400">✓</span>
                            <span className="text-sm text-cyan-300">
                                {fileName || 'Product context added'}
                            </span>
                        </div>
                        <button
                            onClick={clearContext}
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        AI will tailor objections based on your product
                    </p>
                </div>
            ) : (
                <>
                    {/* Mode selector */}
                    <div className="flex gap-2 p-1 bg-gray-800 rounded-lg border border-gray-700">
                        <button
                            onClick={() => setMode('url')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'url' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            🔗 URL
                        </button>
                        <button
                            onClick={() => setMode('text')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'text' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            📝 Paste Text
                        </button>
                        <button
                            onClick={() => setMode('file')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'file' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            📄 Upload
                        </button>
                    </div>

                    {/* URL input */}
                    {mode === 'url' && (
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://yourproduct.com"
                                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                            <button
                                onClick={handleUrlSubmit}
                                disabled={!url.trim() || isLoading}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
                            >
                                {isLoading ? '...' : 'Add'}
                            </button>
                        </div>
                    )}

                    {/* Text input */}
                    {mode === 'text' && (
                        <div className="space-y-2">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste your product description, features, pricing, etc."
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                            />
                            <button
                                onClick={handleTextSubmit}
                                disabled={!text.trim()}
                                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
                            >
                                Add Context
                            </button>
                        </div>
                    )}

                    {/* File upload */}
                    {mode === 'file' && (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt,.md"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="w-full py-4 border-2 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors"
                            >
                                {isLoading ? 'Processing...' : '📎 Click to upload PDF or TXT'}
                            </button>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-red-400">{error}</p>
                    )}

                    <p className="text-xs text-gray-500">
                        Add your product info so the AI asks relevant objections
                    </p>
                </>
            )}
        </div>
    );
}
