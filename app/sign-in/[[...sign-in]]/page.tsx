import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4">
      {/* Radial gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial opacity-50" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tr from-pink-500/10 to-transparent opacity-30" />
      </div>
      
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="mb-2 text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">FlagCheck</h1>
          <p className="text-gray-400 text-base">Sign in to continue</p>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-black/50 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl',
                headerTitle: 'text-white font-bold',
                headerSubtitle: 'text-gray-400',
                socialButtonsBlockButton: 'bg-black/50 border-white/10 text-white backdrop-blur-xl rounded-xl hover:bg-white/5 hover:border-white/20 transition-all',
                formButtonPrimary: 'bg-gradient-primary hover:opacity-90 rounded-xl font-bold transition-all shadow-glow-sm',
                formFieldInput: 'bg-black/50 border-white/10 text-white backdrop-blur-xl rounded-xl focus:border-indigo-500/50 transition-all',
                formFieldLabel: 'text-gray-400 font-semibold',
                footerActionLink: 'text-indigo-400 hover:text-indigo-300 transition-colors',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

