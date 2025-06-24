// ==UserScript==
// @version      1.1.0
// @author       TsukiAkiba, Danny Tsai
// @description   增加YouTube會限清單分頁連結到頻道主頁上
// @description:en  Add members-only-videos link to YouTube channel main page.
// @license      MIT License
// @name         增加會限清單分頁連結
// @name:en      Add members-only-videos link
// @match        https://www.youtube.com/*
// @namespace    https://github.com/erase2004/add-members-only-videos-list-button
// @grant        none
// @run-at       document-start
// @downloadURL https://update.greasyfork.org/scripts/423403/%E5%A2%9E%E5%8A%A0%E6%9C%83%E9%99%90%E6%B8%85%E5%96%AE%E5%88%86%E9%A0%81%E9%80%A3%E7%B5%90.user.js
// @updateURL https://update.greasyfork.org/scripts/423403/%E5%A2%9E%E5%8A%A0%E6%9C%83%E9%99%90%E6%B8%85%E5%96%AE%E5%88%86%E9%A0%81%E9%80%A3%E7%B5%90.meta.js
// ==/UserScript==
(function() {
    'use strict';

    let chId;
    let button;

    // not a fan of such approach, but no better solution for now
    const ogFetch = window.fetch;
    window.fetch = function(req, opts) {
        if (req instanceof Request && req.url === "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false") {
            (async function() {
                const clonedReq = await req.clone().json();
                chId = clonedReq.browseId;
            })();
        }
        return ogFetch(req, opts);
    };

    window.onload = function() {
        const displayTextMap = {
            'zh-Hant-TW': '會限清單',
            'zh-Hant-HK': '會限清單',
            'zh-Hans-CN': '会限清单',
            'ja-JP': 'メン限リスト',
            'en': 'Members-only-video List'
        };
        const buttonTabId = "TAB_ID_SPONSORSHIP_PLAYLIST";
        const displayText = displayTextMap[document.documentElement.lang] || displayTextMap.en;
        const newNodeHtml = `
            <yt-tab-shape class="yt-tab-shape-wiz yt-tab-shape-wiz--host-clickable" role="tab" aria-selected="false" tabindex="0" tab-identifier="${buttonTabId}" tab-title="${displayText}">
                <div class="yt-tab-shape-wiz__tab">${displayText}</div>
                <div class="yt-tab-shape-wiz__tab-bar">
                </div>
            </yt-tab-shape>
        `;
        const escapedNewNodeHtml = (window.trustedTypes && window.trustedTypes.createPolicy && !window.trustedTypes.defaultPolicy) ?
            window.trustedTypes.createPolicy('default', { createHTML: string => string }).createHTML(newNodeHtml) : newNodeHtml;
        const newNode = document.createRange().createContextualFragment(escapedNewNodeHtml);

        const anchorSelector = "yt-tab-shape:nth-last-of-type(2)";

        function addLink() {
            const anchorElement = document.querySelector(anchorSelector);
            if (anchorElement === null) return;
            try {
                anchorElement.parentNode.removeChild(button);
            } catch {
            }

            anchorElement.parentNode.insertBefore(button || newNode, anchorElement);
            if (!button) {
                button = document.querySelector("yt-tab-shape:nth-last-of-type(3)");
                button.addEventListener('click', function() {
                    if (!chId) chId = document.querySelector('[itemprop="identifier"]').getAttribute("content");
                    const targetURL = `${location.protocol}//${location.host}/playlist?list=${chId.replace(/^UC/, 'UUMO')}`;
                    window.open(targetURL);
                });
            }
        }

        if (window.MutationObserver) {
            const observer = new MutationObserver(function(mutations) {
                function mutationCheck(mutation) {
                    return mutation.type == 'childList' &&
                        mutation.target.classList.contains("yt-tab-group-shape-wiz__tabs") &&
                        !mutation.target.querySelector(`[tab-identifier=${buttonTabId}]:not(:first-child)`);
                }
                if (mutations.some(mutationCheck)) {
                    addLink();
                }
            });
            observer.observe(document.querySelector('body'), { "childList": true, "subtree": true });
        }

        function init() {
            const anchorElement = document.querySelector(anchorSelector);
            if (anchorElement) {
                addLink();
            } else {
                setTimeout(init, 10);
            }
        }
        init();
    };
})();
