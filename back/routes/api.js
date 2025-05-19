// Add a health check endpoint
router.head('/health', (req, res) => {
  res.status(200).end();
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});