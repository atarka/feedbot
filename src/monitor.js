import config from './config.js';
import { getDirects, getSubscribers, postDirect, writeComment } from './server.js'
import { deleteSubscriber, getUsersToNotify, getUserSubscribers, storeNotification, storeSubscriber } from './database.js'
import replies from './replies.js';

const getToken = () => {
  return config.token;
}

const sleepyHarry = (timeout) => new Promise((resolve, reject) => setTimeout(resolve, timeout));
const randomMessage = (messages) => messages[Math.floor(Math.random() * messages.length)];
const templateMessage = (message, data) => Object.keys(data).reduce((acc, key) => acc.replace(`:${key}`, data[key] || ''), message);

const main = async () => {
  const users = await getUsersToNotify();
  console.log('scan');

  for (let u = 0; u < users.length; ++u) {
  // users.forEach(async (user) => {
    const user = users[u];
    const baseSubscribers = await getUserSubscribers(user.id);
    const subscribers = await getSubscribers(user.username);
    if (subscribers === null) {
      continue;
    }

    const existingUsers = {};

    for (let i = 0; i < subscribers.length; ++i) {
      const subscriber = subscribers[i];
      if (typeof baseSubscribers[subscriber.id] === 'undefined') {
        console.log(`No user ${subscriber.username}`);
        await storeSubscriber(user.id, subscriber.id, subscriber.username);
      } else {
        existingUsers[subscriber.id] = true;
      }
    }

    const goneUsers = [];
    Object.keys(baseSubscribers).forEach((subscriberId) => {
      if (typeof existingUsers[subscriberId] === 'undefined') {
        goneUsers.push(baseSubscribers[subscriberId]);
      }
    })

    if (goneUsers.length && goneUsers.length < 10) { // Тут мы просто страхуемся от безумия. Если отписалось больше 10 человек сразу - скорее всего, это ошибка, не будем сообщать об этом пользователю гигантской телегой =)
      const direct = await postDirect(user.username, templateMessage(randomMessage(replies.monitoringGone), {
        username: goneUsers.map((gone) => `@${gone.username}`).join(' и '),
      }));

      if (direct && direct.posts && direct.posts.id) {
        await storeNotification(direct.posts.id, 'gone');
      }

      for (let i = 0; i < goneUsers.length; ++i) {
        const gone = goneUsers[i];
        await deleteSubscriber(user.id, gone.subscriber_id);
      }
    }
    await sleepyHarry(200);
  }
}

const mainCycle = async () => {
  while (true) {
    await main();
    await sleepyHarry(120000);
  }
}

mainCycle();