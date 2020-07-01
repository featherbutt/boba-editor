import Quill from "quill";
import React from "react";
import ReactDOM from "react-dom";

const BlockEmbed = Quill.import("blots/block/embed");
const Link = Quill.import("formats/link");

import { addEmbedOverlay, addLoadingMessage, addErrorMessage } from "./utils";

let logging = require("debug")("bobapost:embeds:tweet");
const loggingVerbose = require("debug")("bobapost:embeds:tweet-verbose");

// @ts-ignore
import TwitterIcon from "../img/twitter.svg";

/**
 * TweetEmbed represents a tweet embedded into the editor.
 *
 * Note: the twitter JS library must be installed for the tweets to
 * actually load.
 */
class TweetEmbed extends BlockEmbed {
  static tweetOptions = {
    theme: "dark",
    width: 550,
    align: "center",
  };

  static loadTweet(id: string, node: HTMLDivElement, attemptsRemaining = 5) {
    // @ts-ignore
    window?.twttr?.widgets
      ?.createTweet(id, node, TweetEmbed.tweetOptions)
      .then((el: HTMLDivElement) => {
        logging(`Tweet was loaded!`);
        node.classList.remove("loading");
        node.dataset.rendered = "true";
        // Remove loading message
        node.removeChild(
          node.querySelector(".loading-message") as HTMLDivElement
        );
        logging(`Removing loading message!`);
        if (!el) {
          addErrorMessage(node, {
            message: "This tweet.... it dead.",
            url: TweetEmbed.value(node) || "",
          });
          logging(`Ooops, there's no tweet there!`);
        }
        if (el.getBoundingClientRect().height == 0) {
          node.classList.add("ios-bug");
          ReactDOM.render(React.createElement(TwitterIcon, {}, null), node);
          addErrorMessage(node, {
            message: `You've been hit by... <br />
             You've been strucky by... <br />
             A smooth iOS bug.<br />
             (click to access tweet)`,
            url: TweetEmbed.value(node) || "",
          });
          logging(`That damn iOS bug!`);
        }
        if (TweetEmbed.onLoadCallback) {
          // Add some time to remove the loading class or the
          // calculation of the new tooltip position will be
          // weird
          // TODO: figure out why rather than hack it.
          setTimeout(() => TweetEmbed.onLoadCallback(el), 100);
        }
      })
      .catch((e: any) => {
        logging(`There was a serious error with tweet creation!`);
        logging(e);
      });
    // If the twitter library is not loaded yet, defer rendering
    // @ts-ignore
    if (!window?.twttr?.widgets) {
      logging(`Twitter main library is not loaded.`);
      logging(`${attemptsRemaining} reload attempts remaining`);
      if (!attemptsRemaining) {
        logging(`We're out of attempts! Time to panic!`);
        // Remove loading message
        node.removeChild(
          node.querySelector(".loading-message") as HTMLDivElement
        );
        addErrorMessage(node, {
          message: "The Twitter Embeds library... it dead.",
          url: TweetEmbed.value(node) || "",
        });
        return;
      }
      setTimeout(
        () => TweetEmbed.loadTweet(id, node, attemptsRemaining - 1),
        50
      );
    }
  }

  static renderTweets() {
    // This method needs to be called for any non-quill environments
    // otherwise, tweets will not be rendered
    const tweets = document.querySelectorAll("div.ql-tweet") as NodeListOf<
      HTMLDivElement
    >;
    for (var i = 0; i < tweets.length; i++) {
      while (tweets[i].firstChild) {
        tweets[i].removeChild(tweets[i].firstChild as HTMLDivElement);
      }
      TweetEmbed.loadTweet(tweets[i].dataset.id || "", tweets[i]);
    }
  }

  static create(value: any) {
    const node = super.create();
    logging(`Creating new tweet embed with value ${value}`);
    const url = this.sanitize(value);
    const id = url.substr(url.lastIndexOf("/") + 1);
    node.dataset.url = url;
    node.contentEditable = false;
    node.dataset.id = id;
    node.dataset.rendered = false;

    logging(`Tweet url: ${url}`);
    logging(`Tweet id: ${id}`);

    addLoadingMessage(node, {
      message: "Preparing to chirp...",
      url,
    });

    addEmbedOverlay(node, {
      onClose: () => {
        TweetEmbed.onRemoveRequest?.(node);
      },
    });

    node.classList.add("ql-embed", "tweet", "loading");
    TweetEmbed.loadTweet(id, node);
    return node;
  }

  static setOnLoadCallback(callback: (root: HTMLDivElement) => void) {
    TweetEmbed.onLoadCallback = callback;
  }

  static value(domNode: HTMLDivElement) {
    loggingVerbose(`Getting value of embed from data:`);
    loggingVerbose(domNode.dataset);
    return domNode.dataset.url;
  }

  static sanitize(url: string) {
    if (url.indexOf("?") !== -1) {
      url = url.substring(0, url.indexOf("?"));
    }
    return Link.sanitize(url); // eslint-disable-line import/no-named-as-default-member
  }
}

TweetEmbed.blotName = "tweet";
TweetEmbed.tagName = "div";
TweetEmbed.className = "ql-tweet";

export default TweetEmbed;