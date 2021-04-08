const axios = require('axios');

const FORUMS_TOKEN = process.env.FORUMS_TOKEN;

const createThread = async (nodeID, title, description) => {
  const params = new URLSearchParams();
  params.append(`node_id`, nodeID);
  params.append(`title`, title);
  params.append(`message`, description);

  try {
    const res = await axios({
      method: 'post',
      url: `https://thetechhaven.com/api/threads`,
      params,
      headers: {
        'XF-Api-Key': FORUMS_TOKEN,
      },
    });

    return res.data;
  } catch (error) {
    return { error };
  }
};

exports.createThread = createThread;
