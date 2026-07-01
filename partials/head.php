<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HAB Barbershop — POS System</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<link rel="stylesheet" href="assets/css/style.css">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        /* Remapped for soft light minimalist theme */
        gold: { DEFAULT:'#374151', light:'#4B5563', dark:'#1F2937' },
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
/* Override Chart.js defaults for light theme — runs before any chart is rendered */
document.addEventListener('DOMContentLoaded', function() {
  if (window.Chart) {
    Chart.defaults.color = '#6B6B6B';
    Chart.defaults.font.family = 'Inter';
    Chart.defaults.borderColor = '#EBEBEB';
    Chart.defaults.backgroundColor = 'transparent';
  }
});
</script>
</head>
