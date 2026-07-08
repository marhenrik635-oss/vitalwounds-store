const WelcomeBanner = () => {
  return (
    <div className="card p-6 animate-fade-in-up">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-vw-accent-light flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-vw-accent">VW</span>
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-vw-text mb-1.5 text-balance">
            Selamat Datang di Vitalwounds Store
          </h2>
          <p className="text-sm text-vw-muted leading-relaxed max-w-prose">
            Platform layanan digital premium terlengkap di Indonesia. Nikmati kemudahan berbelanja App Premium dan layanan digital lainnya dalam satu akun.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
