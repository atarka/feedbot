import config from './config.js';
import { Connection } from './realtime.js';
import Pipeline from './pipeline.js';
import { getDirects, writeComment } from './server.js';

// const [rows, fields] = await connection.execute(

const getToken = () => {
  return config.token;
}

const messageHandlers = {
  "post:new": (data) => {
    return {
      type: 'post',
      id: data.posts.id,
      from: (({ id, username, type }) => ({ id, username, type }))(data.users[0]),
      text: data.posts.body,
      postedTo: data.posts.postedTo,
    }
  },

  "comment:new": (data) => {
    const { comments: c } = data;
    return {
      type: 'comment',
      id: c.id,
      postId: c.postId,
      from: (({ id, username, type }) => ({ id, username, type }))(data.users[0]),
      text: c.body,
    }
  },

  "like:new": (data) => {
    return {
      type: 'like',
      from: (({ id, username, type }) => ({ id, username, type }))(data.users),
      postId: data.meta && data.meta.postId ? data.meta.postId : null,
    }
  }
}


const pipeline = new Pipeline();


const startTheRiot = async () => {
  try {
    const directTimeline = await getDirects();

    const conn = new Connection({ apiRoot: config.apiRoot, getToken });
    conn.onConnect(() => {
      conn.reAuthorize().then(() => {
        conn.subscribeTo(`timeline:${directTimeline}`);
      });
    })

    conn.onReconnect(() => {
      conn.reAuthorize().then(() => {
        conn.subscribeTo(`timeline:${directTimeline}`);
      });
    })

    conn.onEvent((event, data) => {
      console.log(`event`);
      console.log(event);

      if (messageHandlers[event]) {
        const message = messageHandlers[event](data);
        if (message) {
          if (message.from && message.from.username === 'unsubscribebot') return;
          pipeline.push(message);
        }
      } else {
        console.log(data);
      }
    })

  } catch (e) {
    console.log(e);
  }
}

startTheRiot();
