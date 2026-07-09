const WelcomeBanner = () => {
  return (
    <div className="card p-6 animate-fade-in-up">
      <div className="flex items-start gap-4">
        <img src="/logo.png" alt="Vitalwounds" className="w-12 h-12 rounded-xl object-contain shrink-0 bg-white" />
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
