import { getSubscribers, sendRequest, writeComment } from './server.js'
import { getNotification, getUser, storeUser, updateUser } from './database.js'
import replies from './replies.js';
import randomJoke from './jokes.js';


const sleepyHarry = (timeout) => new Promise((resolve, reject) => setTimeout(resolve, timeout));
const randomMessage = (messages) => messages[Math.floor(Math.random() * messages.length)];
const templateMessage = (message, data) => Object.keys(data).reduce((acc, key) => acc.replace(`:${key}`, data[key] || ''), message);
const verbalNumber = (sum, one, four, many, options= {}) => {
  const num = typeof sum === 'string' ? parseInt(sum) : sum;
  const checkSum = num % 100;
  const prefix = options.skipNumber ? '' : (options.separate ? separateDigits(num) : num) + ' ';

  if (checkSum <= 10 || checkSum >= 20) {
    switch (checkSum % 10) {
      case 1:
        return prefix + one;
      case 2:	case 3: case 4:
        return prefix + four;
    }
  }

  return prefix + many;
}


class Pipeline {
  constructor (props) {
    this.events = [];
  }

  async reply (to, message) {
    const replyId = ((to) => {
      if (to.type === 'post') {
        return to.id;
      } else if (to.type === 'comment') {
        return to.postId;
      } else if (to.type === 'like') {
        return to.postId;
      }
      return null;
    })(to);

    if (!replyId) return false;
    const messages = typeof message === 'string' ? [message] : message;
    messages.forEach((text, i) => setTimeout(() => {
      writeComment(replyId, text);
    }, i * 300));

    await sleepyHarry((messages.length + 1) * 300);
    return true;
  }

  async activateMonitoring (message) {
    try {
      const user = await getUser(message.from.id);
      if (!user) {
        await this.reply(message, 'Не смог почему-то активировать слежение. Скажите Атарке, а? Он меня починит.');
        return true;
      }

      if (user.notify === 'on') {
        await this.reply(message, randomMessage(replies.monitoringAlready));
        return true;
      }

      const subscribers = await getSubscribers(message.from.username);
      if (subscribers === null) {
        await sendRequest(message.from.username);
        await this.reply(message, 'Я не смог прочитать список текущих подписчиков — наверное, ваш фид в приватном режиме, да? ' +
          'Послал запрос на дружбу, примите его, если доверяете бездушной железяке (ну и Атари), и попробуйте снова :)'); // FIXME
        return true;
      }


      await updateUser(user.id, { notify: 'on' });
      await this.reply(message, templateMessage(randomMessage(replies.monitoringStart), {
        subscribers: verbalNumber(subscribers.length, 'подписчик', 'подписчика', 'подписчиков')
      }));

    } catch (e) {
      await this.reply(message, 'Не смог прочитать список подписчиков!'); // FIXME
    }

    return true;
  }

  async deactivateMonitoring (message) {
    try {
      const user = await getUser(message.from.id);
      if (!user) {
        await this.reply(message, 'Не смог почему-то отключить слежение. Скажите Атарке, а? Он меня починит.');
        return true;
      }

      if (user.notify == '') {
        await this.reply(message, randomMessage(replies.monitoringNever));
        return true;
      }

      await updateUser(user.id, { notify: '' });
      await this.reply(message, randomMessage(replies.monitoringEnd));

    } catch (e) {
      await this.reply(message, 'Не смог почему-то отключить слежение. Скажите Атарке, а? Он меня починит.'); // FIXME
    }

    return true;
  }

  async processCommand (message) {
    const text = message.text.toLowerCase().replace(/^[\r\n\t ]*(.+?)[\r\n\t ]*$/si, '$1');

    if (text.match(/^(помощь|команды|помогите|спасите)$/)) {
      return await this.reply(message, replies.helpCommands);
    } else if (text.match(/^(следить|слежка)$/)) {
      return await this.activateMonitoring(message);

    } else if (text.match(/^(отставить|прекратить|отмена)$/)) {
      return await this.deactivateMonitoring(message);

    } else if (text.match(/^(статистика)$/)) {
      return await this.reply(message, "Ой. Я забыл добавить статистику (краснеет) может позже! :)");

    } else if (text.match(/^(шутка|грустно)$/)) {
      return await this.reply(message, randomJoke());
    }

    return false;
  }

  async push (message) {
    if (message) {
      const user = message.from ? await getUser(message.from.id) : null;

      if (message.type === 'post' && !user) { // Такого пользователя у нас нет. Давайте создадим его!
        await sleepyHarry(1500);
        await this.reply(message,  replies.greetingsNewUser);
        await storeUser(message.from);
        await sleepyHarry(500);
      }

      if (message.type === 'post' || message.type === 'comment') {
        if (message.type === 'post') {
          await sleepyHarry(1500);
        }
        const replied = await this.processCommand(message);
        if (!replied) {
          if (user) {
            this.reply(message, randomMessage(replies.commandUnrecognized));
          }
        }
      }

      if (message.type === 'like') {
        if (message.postId) {
          const notify = await getNotification(message.postId);
          if (notify) {
            await this.reply(message, randomMessage(replies.monitoringGoodNews));
          }
        }
      }
    }

  }
}

export default Pipeline;
