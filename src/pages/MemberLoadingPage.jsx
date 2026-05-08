export default function MemberLoadingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-2xl">
                <div className="flex flex-col items-center text-center gap-6">
                    {/* Logo */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-white/10"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
                        <div className="absolute inset-3 rounded-full bg-cyan-400/20 animate-pulse"></div>
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-wide">
                            Member Area
                        </h1>
                        <p className="text-slate-300 mt-2 text-sm">
                            Preparing your personalized dashboard...
                        </p>
                    </div>

                    {/* Loading Bars */}
                    <div className="w-full space-y-4 mt-4">
                        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full w-2/3 bg-cyan-400 rounded-full animate-pulse"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-20 rounded-2xl bg-white/5 animate-pulse"></div>
                            <div className="h-20 rounded-2xl bg-white/5 animate-pulse delay-100"></div>
                        </div>

                        <div className="h-16 rounded-2xl bg-white/5 animate-pulse delay-200"></div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        Loading secure member content...
                    </div>
                </div>
            </div>
        </div>
    );
}
