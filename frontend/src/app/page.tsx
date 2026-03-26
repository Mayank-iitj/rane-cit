'use client'

import { ChevronRight, Zap, TrendingUp, Shield, Cpu, BarChart3, Settings, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="container-max flex items-center justify-between py-6">
          <Link href="/" className="text-2xl font-bold">
            CNC <span className="gradient-text">INTELLIGENCE</span>
          </Link>
          <div className="hidden md:flex gap-12 items-center">
            <a href="#about" className="text-sm font-medium hover:text-cyan-500 transition">O NAS</a>
            <a href="#services" className="text-sm font-medium hover:text-cyan-500 transition">USŁUGI</a>
            <a href="#process" className="text-sm font-medium hover:text-cyan-500 transition">PROCES</a>
            <a href="#portfolio" className="text-sm font-medium hover:text-cyan-500 transition">PORTFOLIO</a>
            <a href="#contact" className="button-accent px-6 py-2 text-sm">KONTAKT</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="section-spacing bg-white">
        <div className="container-max">
          <div className="space-y-8">
            <div className="inline-block">
              <div className="divider-accent"></div>
              <p className="text-sm font-semibold text-slate-600 tracking-widest">INDUSTRIAL AI PLATFORM</p>
            </div>
            
            <h1 className="hero-text">
              Inteligencja maszyn,
              <br />
              <span className="gradient-text">które się liczą.</span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Łączymy Machine Learning, przetwarzanie sygnałów i analizę danych w jedną spójną platformę dla precyzyjnych obrabiarek CNC. Predykcja trwałości narzędzi, detekcja anomalii i optymalizacja procesów – wszystko w czasie rzeczywistym.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <Link href="/dashboard" className="button-primary">
                ZOBACZ DEMO
              </Link>
              <button className="button-secondary">
                DOKUMENTACJA <ChevronRight className="inline ml-2 w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 border-t border-slate-200">
              <div>
                <p className="text-5xl font-bold text-cyan-500">700%</p>
                <p className="text-sm text-slate-600 mt-2">Średni ROI</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-cyan-500">1.4</p>
                <p className="text-sm text-slate-600 mt-2">Miesiące zwrotu</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-cyan-500">$127K</p>
                <p className="text-sm text-slate-600 mt-2">Roczne oszczędności</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* O NAS - ABOUT */}
      <section id="about" className="section-spacing dark-section">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">
                Budujemy inteligencję dla fabryk, które nie mogą sobie pozwolić na błędy.
              </h2>
              <p className="text-slate-300 mt-6">
                Od sześciu lat pracujemy z producentami obrabiarek precyzyjnych na całym świecie. Wiemy, co oznacza utrata narzędzia w rzeczywistym czasie produkcji. Wiemy, jak wygląda przestój nieplanowany. Wiemy, co kosztuje szum w danych.
              </p>
              <p className="text-slate-300 mt-4">
                Dlatego zbudowaliśmy platformę, która nie zgaduje. Która mierzy, analizuje i przewiduje z pewnością 95%.
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-12 aspect-square flex items-center justify-center">
              <div className="text-center">
                <Cpu className="w-24 h-24 text-cyan-400 mx-auto mb-4" />
                <p className="text-slate-300 text-sm">Real-time ML inference</p>
                <p className="text-slate-400 text-xs mt-2">LSTM + XGBoost + Isolation Forest</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section-spacing bg-white">
        <div className="container-max">
          <div className="space-y-20">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">NASZA OFERTA</h2>
              <p className="text-xl text-slate-600 max-w-2xl">
                Sześć modułów, które razem tworzą kompletny obraz zdrowia Twoich maszyn.
              </p>
            </div>

            {/* Service Cards */}
            <div className="grid-cols-services">
              {/* 01 RUL */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">01</p>
                  <h3 className="text-2xl font-bold">Przewidywanie trwałości</h3>
                  <p>LSTM deep learning dostarcza prognozę pozostałej żywotności narzędzia z dokładnością 95%+. Real-time.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Zmniejszenie przestojów o 75%
                  </div>
                </div>
              </div>

              {/* 02 Anomaly */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">02</p>
                  <h3 className="text-2xl font-bold">Detekcja anomalii</h3>
                  <p>Isolation Forest i analiza hybrydowa identyfikują nienormalne zachowania zanim staną się problemami.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Wczesne wykrywanie problemów
                  </div>
                </div>
              </div>

              {/* 03 Optimization */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">03</p>
                  <h3 className="text-2xl font-bold">Optymalizacja procesów</h3>
                  <p>XGBoost rekomenduje parametry posuw i obroty dla maksymalnej wydajności i trwałości narzędziem.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <Zap className="w-5 h-5 mr-2" />
                    5-40% wzrost wydajności
                  </div>
                </div>
              </div>

              {/* 04 Protocols */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">04</p>
                  <h3 className="text-2xl font-bold">Wieloprotokołowa integracja</h3>
                  <p>MTConnect, OPC-UA, Modbus, MQTT – pracujemy z każdą obrabiarką. Zero modyfikacji hardware'u.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <Settings className="w-5 h-5 mr-2" />
                    Kompatybilne z każdy CNC
                  </div>
                </div>
              </div>

              {/* 05 Streaming */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">05</p>
                  <h3 className="text-2xl font-bold">Streaming w czasie rzeczywistym</h3>
                  <p>Kafka + WebSocket dla live dashboardów. 1-2 sekundowe opóźnienia, 1000s maszyn jednocześnie.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Widoczność na żywo
                  </div>
                </div>
              </div>

              {/* 06 ROI */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">06</p>
                  <h3 className="text-2xl font-bold">ROI Analytics</h3>
                  <p>Obliczenia oszczędności: narzędzia (-30%), przestoje (-75%), braki (-55%). Dashboard finansowy.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    $127K rocznych oszczędności
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="section-spacing dark-section">
        <div className="container-max">
          <div className="space-y-20">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">NASZE PROCESY</h2>
              <p className="text-xl text-slate-300">
                Od rozmowy do pełnej produkcji w czterech krokach.
              </p>
            </div>

            <div className="grid-cols-process">
              {/* Step 1 */}
              <div className="space-y-6">
                <div className="bg-cyan-500 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
                  01
                </div>
                <h3 className="text-2xl font-bold">Diagnosis & Strategy</h3>
                <p className="text-slate-300">
                  Analizujemy Twoje maszyny, protokoły i aktualne boleści. Budujemy plan wdrożenia i harmonogram.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-6">
                <div className="bg-cyan-500 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
                  02
                </div>
                <h3 className="text-2xl font-bold">Integration & Testing</h3>
                <p className="text-slate-300">
                  Instalujemy adaptery protokołowe. Testujemy na 30 dni w parallel z produkcją. Zero ryzyka.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-6">
                <div className="bg-cyan-500 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
                  03
                </div>
                <h3 className="text-2xl font-bold">Deployment & Training</h3>
                <p className="text-slate-300">
                  Pełne wdrażanie. Szkolenie zespołów. Dashboardy w produkcji – operatorzy od razu widzą wartość.
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-6">
                <div className="bg-cyan-500 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
                  04
                </div>
                <h3 className="text-2xl font-bold">Support & Optimization</h3>
                <p className="text-slate-300">
                  Stała opieka. Optymalizacja modeli. Nowe cechy. Jesteśmy partnerem na lata.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="section-spacing bg-white">
        <div className="container-max">
          <div className="space-y-20">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">CASE STUDIES</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Case 1 */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Cpu className="w-16 h-16 text-slate-400 mx-auto" />
                    <p className="text-slate-500 mt-4">Fanuc Manufacturing Plant</p>
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Fabryka precyzyjnych części lotniczych</h3>
                <p className="text-slate-600">Zmniejszenie nieplanowanych przestojów o 75%. Prognoza trwałości narzędzi z dokładnością 96%. ROI 820% w 1.2 miesiąca.</p>
                <p className="text-sm text-slate-400 font-semibold">12 obrabiarek • LSTM + Isolation Forest • Kafka streaming</p>
              </div>

              {/* Case 2 */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-slate-400 mx-auto" />
                    <p className="text-slate-500 mt-4">Siemens Production Line</p>
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Linia produkcyjna hydrauliki przemysłowej</h3>
                <p className="text-slate-600">Oszczędności narzędzi $180K rocznie. Optymalizacja procesu: +22% wydajności. Wdrożenie: 3 tygodnie.</p>
                <p className="text-sm text-slate-400 font-semibold">24 maszyny • MTConnect + OPC-UA • Multi-tenant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-spacing dark-section border-t border-slate-700">
        <div className="container-max">
          <div className="max-w-2xl">
            <div className="space-y-8">
              <div>
                <div className="divider-accent"></div>
                <h2 className="section-title text-white">
                  Rozmawiajmy <br />
                  o Twojej strategii.
                </h2>
              </div>
              
              <p className="text-xl text-slate-300">
                Nie musisz mieć gotowego briefu. Wystarczy, że opowiesz nam o swoich maszynach – resztą zajmiemy się my.
              </p>

              <form className="space-y-6 pt-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Opowiedz o Twojej fabryce</label>
                  <textarea 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    rows={6}
                    placeholder="Ile maszyn? Jakie kontrolery? Jakie boleści?"
                  />
                </div>
                <button type="submit" className="button-accent w-full">
                  WYŚLIJ WIADOMOŚĆ
                </button>
              </form>

              <div className="border-t border-slate-700 pt-8 space-y-4">
                <p className="text-sm text-slate-400">KONTAKT</p>
                <p className="text-white font-semibold">contact@cncintelligence.com</p>
                <p className="text-slate-300">Warszawa, Polska</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white border-t border-slate-800 py-12">
        <div className="container-max">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-4">PRODUKT</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Demo</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-4">COMPANY</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-4">RESOURCES</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition">Docs</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">API</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Support</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-4">LEGAL</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Terms</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8">
            <p className="text-sm text-slate-500">© 2026 CNC Intelligence. Building the future of precision manufacturing.</p>
            <div className="flex gap-6 mt-6 md:mt-0">
              <a href="#" className="text-slate-500 hover:text-cyan-400 text-sm transition">Instagram</a>
              <a href="#" className="text-slate-500 hover:text-cyan-400 text-sm transition">LinkedIn</a>
              <a href="#" className="text-slate-500 hover:text-cyan-400 text-sm transition">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
