import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/axios';
import { Search, FileText, Receipt, Truck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchResult {
    id: number;
    type: string;
    title: string;
    subtitle: string;
    details: string;
    url: string;
}

interface SearchResults {
    lrs: SearchResult[];
    invoices: SearchResult[];
    vehicles: SearchResult[];
    total: number;
}

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.length >= 2) {
                performSearch();
            } else {
                setResults(null);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const performSearch = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
            setResults(response.data);
            setShowResults(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (url: string) => {
        window.location.hash = url;
        setShowResults(false);
        setQuery('');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'LR':
                return <FileText size={16} className="text-blue-600" />;
            case 'Invoice':
                return <Receipt size={16} className="text-green-600" />;
            case 'Vehicle':
                return <Truck size={16} className="text-purple-600" />;
            default:
                return <Search size={16} />;
        }
    };

    return (
        <div className="relative" ref={searchRef}>
            <div className="relative">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                    type="text"
                    placeholder="Search LR, Invoice, Vehicle..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                    className="pl-10 pr-10 w-full md:w-80"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults(null);
                            setShowResults(false);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {showResults && results && (
                <div className="absolute top-full mt-2 w-full md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : results.total === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="py-2">
                            {results.lrs.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        LRs ({results.lrs.length})
                                    </div>
                                    {results.lrs.map((result) => (
                                        <button
                                            key={result.id}
                                            onClick={() => handleResultClick(result.url)}
                                            className="w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
                                        >
                                            {getIcon(result.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {result.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {result.subtitle}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {result.details}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.invoices.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Invoices ({results.invoices.length})
                                    </div>
                                    {results.invoices.map((result) => (
                                        <button
                                            key={result.id}
                                            onClick={() => handleResultClick(result.url)}
                                            className="w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
                                        >
                                            {getIcon(result.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {result.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {result.subtitle}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {result.details}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.vehicles.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Vehicles ({results.vehicles.length})
                                    </div>
                                    {results.vehicles.map((result) => (
                                        <button
                                            key={result.id}
                                            onClick={() => handleResultClick(result.url)}
                                            className="w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
                                        >
                                            {getIcon(result.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {result.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {result.subtitle}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {result.details}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
