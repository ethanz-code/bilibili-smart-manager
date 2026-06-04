declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any, callback?: (response: any) => void): void;
    const onMessage: {
      addListener(
        callback: (
          message: any,
          sender: { tab?: chrome.tabs.Tab; id?: string },
          sendResponse: (response?: any) => void
        ) => boolean | void
      ): void;
    };
    const onInstalled: {
      addListener(callback: () => void): void;
    };
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
    }
    function query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback: (tabs: Tab[]) => void
    ): void;
    function sendMessage(tabId: number, message: any, callback?: (response: any) => void): void;
  }

  namespace alarms {
    function create(name: string, alarmInfo: { periodInMinutes?: number; delayInMinutes?: number }): void;
    const onAlarm: {
      addListener(callback: (alarm: { name: string }) => void): void;
    };
  }
}
