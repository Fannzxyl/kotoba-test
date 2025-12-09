import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#050508] text-white p-6 tex-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce-short">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-gray-400 mb-8 text-center max-w-xs">
                        Aplikasi mengalami error yang tidak terduga. Mohon maaf atas ketidaknyamanan ini.
                    </p>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/10 mb-8 max-w-sm w-full overflow-auto">
                        <p className="font-mono text-xs text-red-300">
                            {this.state.error?.toString()}
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-primary rounded-full font-bold hover:bg-primary/80 transition-all active:scale-95"
                    >
                        <RefreshCw size={18} />
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
