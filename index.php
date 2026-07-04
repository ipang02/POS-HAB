<?php
// ============================================================
// HAB Barbershop — POS System v1.0
// Hostinger Deployment Ready | Demo Mode (localStorage)
// ============================================================
require 'config.php';
?>
<!DOCTYPE html>
<html lang="en">
<?php include 'partials/head.php'; ?>
<body>

<?php include 'views/pin-screen.php'; ?>
<?php include 'views/setup-wizard.php'; ?>

<!-- Mobile sidebar backdrop -->
<div id="mob-overlay" onclick="closeMobileSidebar()"></div>

<?php include 'partials/sidebar.php'; ?>

<!-- ══ Main Wrapper ══════════════════════════════════════════ -->
<div id="main-wrap" class="ml-[260px] min-h-screen flex flex-col transition-all duration-300">

  <?php include 'partials/navbar.php'; ?>

  <main class="flex-1 p-6">
    <?php include 'views/dashboard.php'; ?>
    <?php include 'views/pos.php'; ?>
    <?php include 'views/services.php'; ?>
    <?php include 'views/appointments.php'; ?>
    <?php include 'views/barbers.php'; ?>
    <?php include 'views/analytics.php'; ?>
    <?php include 'views/inventory.php'; ?>
    <?php include 'views/settings.php'; ?>
    <?php include 'views/customers.php'; ?>
  </main>

</div><!-- /main-wrap -->

<!-- ══ Modals ════════════════════════════════════════════════ -->
<?php include 'modals/modal-branch.php'; ?>
<?php include 'modals/modal-service.php'; ?>
<?php include 'modals/modal-barber.php'; ?>
<?php include 'modals/modal-payment.php'; ?>
<?php include 'modals/modal-receipt.php'; ?>
<?php include 'modals/modal-appointment.php'; ?>
<?php include 'modals/modal-shift.php'; ?>
<?php include 'modals/modal-customer.php'; ?>
<?php include 'modals/modal-confirm.php'; ?>

<!-- Toast Container -->
<div id="toast-wrap" class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 no-print pointer-events-none"></div>

<!-- Print Receipt Area -->
<div id="print-receipt"></div>

<!-- ══ Scripts (order matters) ════════════════════════════════ -->
<script>window.HAB_API_TOKEN = '<?= htmlspecialchars(defined('API_TOKEN') ? API_TOKEN : '', ENT_QUOTES, 'UTF-8') ?>';</script>
<script src="assets/js/app.js?v=<?= filemtime('assets/js/app.js') ?>"></script>
<script src="assets/js/auth.js?v=<?= filemtime('assets/js/auth.js') ?>"></script>
<script src="assets/js/customers.js?v=<?= filemtime('assets/js/customers.js') ?>"></script>
<script src="assets/js/services-mgmt.js?v=<?= filemtime('assets/js/services-mgmt.js') ?>"></script>
<script src="assets/js/dashboard.js?v=<?= filemtime('assets/js/dashboard.js') ?>"></script>
<script src="assets/js/pos.js?v=<?= filemtime('assets/js/pos.js') ?>"></script>
<script src="assets/js/appointments.js?v=<?= filemtime('assets/js/appointments.js') ?>"></script>
<script src="assets/js/barbers.js?v=<?= filemtime('assets/js/barbers.js') ?>"></script>
<script src="assets/js/analytics.js?v=<?= filemtime('assets/js/analytics.js') ?>"></script>
<script src="assets/js/inventory.js?v=<?= filemtime('assets/js/inventory.js') ?>"></script>
<script src="assets/js/settings.js?v=<?= filemtime('assets/js/settings.js') ?>"></script>
<script src="assets/js/setup-wizard.js?v=<?= filemtime('assets/js/setup-wizard.js') ?>"></script>

</body>
</html>
