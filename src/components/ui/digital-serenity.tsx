import React, { useEffect } from 'react';

const DigitalSerenity = () => {
  useEffect(() => {
    const animateWords = () => {
      const wordElements = document.querySelectorAll('.word-animate');
      wordElements.forEach(word => {
        const delay = parseInt(word.getAttribute('data-delay')) || 0;
        setTimeout(() => {
          if (word) (word as HTMLElement).style.animation = 'word-appear 0.5s ease-out forwards';
        }, delay);
      });
    };
    const timeoutId = setTimeout(animateWords, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  const pageStyles = `
    @keyframes word-appear { 0% { opacity: 0; transform: translateY(30px) scale(0.8); filter: blur(10px); } 50% { opacity: 0.8; transform: translateY(10px) scale(0.95); filter: blur(2px); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
    .word-animate { display: inline-block; opacity: 0; margin: 0 0.1em; transition: color 0.3s ease, transform 0.3s ease; }
    .word-animate:hover { transform: translateY(-2px); }
    .text-decoration-animate { position: relative; }
    .text-decoration-animate::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px; background: linear-gradient(90deg, transparent, #cbd5e1, transparent); animation: underline-grow 2s ease-out forwards; animation-delay: 2s; }
    @keyframes underline-grow { to { width: 100%; } }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <h1 className="text-4xl md:text-5xl font-bold text-decoration-animate">
        <div className="mb-4 md:mb-6">
          <span className="word-animate" data-delay="500">Seu</span>
          <span className="word-animate" data-delay="650">Companheiro</span>
          <span className="word-animate" data-delay="800">para</span>
        </div>
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-thin leading-relaxed tracking-wide">
          <span className="word-animate" data-delay="1200">Fitness</span>
          <span className="word-animate" data-delay="1350">e</span>
          <span className="word-animate" data-delay="1500">Nutrição</span>
        </div>
      </h1>
    </>
  );
};

export default DigitalSerenity;