module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        // Definisce l'animazione: usa keyframes 'color-cycle', dura 8s, è infinita e usa easing 'ease-in-out'
        'color-cycle': 'color-cycle 8s infinite ease-in-out', 
      },
      keyframes: {
        'color-cycle': ({ theme }) => {
          // Nota: Per usare i colori delle fasi (A, B, C, D) devi usare l'helper 'hexToRgba' nel tuo codice App.tsx
          // I colori esatti sono definiti nello stato phaseStyles. Qui li rappresentiamo con placeholder per il config di Tailwind.
          // In App.tsx, assumeremo che esista una funzione che applica il box-shadow corretto in base allo stato del componente.
          // Tuttavia, dato che la logica dei colori è complessa (dipende da phaseStyles), è più pulito definire l'animazione su placeholder e applicare i colori nel JS o utilizzare una libreria CSS-in-JS.
          
          // Se phaseStyles fosse importabile qui, useremmo i suoi colori. 
          // Essendo un file di configurazione puramente CSS/Tailwind, uso placeholder per i 4 colori.
          // Dovrai assicurarti che la funzione `hexToRgba` sia definita per convertire i codici esadecimali (es. #5f8dff) in RGBA con opacità.
          
          // Ipotizzando che i colori siano: Blu, Giallo, Verde, Rosso (dalle tue fasi A, B, C, D)
          return {
            '0%, 100%': { boxShadow: '0 0 30px rgba(95, 141, 255, 0.6)' }, // Colore A: Blu
            '25%': { boxShadow: '0 0 30px rgba(241, 181, 79, 0.6)' }, // Colore B: Giallo
            '50%': { boxShadow: '0 0 30px rgba(103, 203, 103, 0.6)' }, // Colore C: Verde
            '75%': { boxShadow: '0 0 30px rgba(255, 100, 100, 0.6)' }, // Colore D: Rosso (Approssimazioni dai tuoi stili di fase)
          };
        },
      },
    },
  },
  plugins: [],
}
