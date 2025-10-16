exports.handler = async (event) => {
  try {
    const { action, adminCode } = JSON.parse(event.body);

    if (action === 'validate-admin-code') {
      const ADMIN_CODE = process.env.ADMIN_CODE || 'your-secret-admin-code';
      
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: adminCode === ADMIN_CODE })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unknown action' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
