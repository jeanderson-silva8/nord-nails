import { useState, useEffect } from 'react';
import Header from './sections/Header';
import Hero from './sections/Hero';
import Services from './sections/Services';
import Locations from './sections/Locations';
import Lookbook from './sections/Lookbook';
import About from './sections/About';
import Technique from './sections/Technique';
import Testimonials from './sections/Testimonials';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import AgendarModal from './components/AgendarModal';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsModalOpen(true);
    window.addEventListener('open-agendar-modal', handler);
    return () => window.removeEventListener('open-agendar-modal', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Services />
        <Locations />
        <Lookbook />
        <About />
        <Technique />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <AgendarModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default App;
