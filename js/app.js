// Entry point: load data, then start the dashboard.
import { loadDashboardData } from './data.js';
import { initDashboard } from './dashboard.js';

const loader = document.getElementById('appLoading');

try {
  const RAW = await loadDashboardData();
  initDashboard(RAW);
  loader.remove();
} catch (err) {
  console.error(err);
  loader.classList.add('error');
  loader.querySelector('.msg').textContent =
    'Could not load dashboard data. ' + err.message +
    (location.protocol === 'file:' ? ' — open this site through a web server (see README), not by double-clicking index.html.' : '');
}
