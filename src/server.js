import fetch from 'node-fetch';
import config from './config.js';

const feedQueryString = ({ offset, sortChronologically, homeFeedMode, from }) =>
  [
    offset && `offset=${offset}`,
    sortChronologically && `sort=created`,
    homeFeedMode && `homefeed-mode=${encodeURIComponent(homeFeedMode)}`,
    from && `created-before=${getDateForMemoriesRequest(from).toISOString()}`,
  ]
    .filter(Boolean)
    .join('&');

const getRequestOptions = () => ({
  headers: {
    Accept: 'application/json',
    ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
  },
});

const postRequestOptions = (method = 'POST', body = {}) => ({
  method,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
  },
  body: JSON.stringify(body),
});

const getDirects = async (params = {}) => {
  const response = await fetch(
    `${config.apiRoot}/v2/timelines/filter/directs?${feedQueryString(params)}`,
    getRequestOptions(),
  );

  const data = await response.json();
  return data.timelines.id;
}

const getSubscribers = async (username) => {
  console.log(`${config.apiRoot}/v1/users/${username}/subscribers`,);
  const response = await fetch(
    `${config.apiRoot}/v1/users/${username}/subscribers`,
    getRequestOptions(),
  );

  const data = await response.json();
  return data.subscribers || null;
}

const sendRequest = async (username) => {
  const response = await fetch(
    `${config.apiRoot}/v1/users/${username}/sendRequest`,
    postRequestOptions()
  );

  console.log(response);
  return await response.json();
}

const writeComment = async (postId, text) => {
  try {
    const response = await fetch(
      `${config.apiRoot}/v1/comments`,
      postRequestOptions('POST', { comment: { body: text, postId } }),
    );
    return await response.json();

  } catch (e) {
    return null;
  }
}

const postDirect = async (username, text) => {
  try {
    const response = await fetch(
      `${config.apiRoot}/v1/posts`,
      postRequestOptions('POST', {
        post: {
          body: text,
          attachments:[]
        },
        meta: {
          feeds:[username],
          commentsDisabled:false
        }
      }),
    );
    return await response.json();

  } catch (e) {
    return null;
  }
}

export {
  getDirects,
  writeComment,
  getSubscribers,
  sendRequest,
  postDirect,
}