<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HAB Barbershop — POS System</title>
<link rel="icon" type="image/png" href="logo-hab.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<link rel="stylesheet" href="assets/css/style.css?v=<?= filemtime('assets/css/style.css') ?>">
<script>
/* Apply saved theme before first paint to avoid flash */
(function(){
  var t = localStorage.getItem('hab_theme');
  if (t === 'dark') document.documentElement.classList.add('dark');
})();
</script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: 'rgb(var(--gold-rgb) / <alpha-value>)',
          light:   'rgb(var(--gold-rgb) / 0.7)',
          dark:    'rgb(var(--gold-rgb) / 0.5)'
        },
        ink:  { 900:'#F8F8F6', 800:'#F4F4F2', 700:'#FFFFFF', 600:'#EBEBEB', 500:'#E0E0DE' }
      },
      fontFamily: {
        sans: ['Inter','sans-serif'],
        display: ['Playfair Display','serif']
      }
    }
  }
}
</script>
<script>
/* Override Chart.js defaults — updates when theme changes */
function applyChartTheme() {
  if (!window.Chart) return;
  var dark = document.documentElement.classList.contains('dark');
  Chart.defaults.color = dark ? 'rgba(255,255,255,0.45)' : '#6B6B6B';
  Chart.defaults.font.family = 'Inter';
  Chart.defaults.borderColor = dark ? 'rgba(255,255,255,0.08)' : '#EBEBEB';
  Chart.defaults.backgroundColor = 'transparent';
}
document.addEventListener('DOMContentLoaded', applyChartTheme);
</script>
</head>
