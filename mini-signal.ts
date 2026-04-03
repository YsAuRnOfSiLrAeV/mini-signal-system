type Readable<T> = {
  readonly value: T
}

type Writable<T> = {
  value: T
}

type SubscribersSet = Set<ReactiveSubscriber>

type ReactiveSubscriber = {
  subscriptions: Set<SubscribersSet>
  run: () => void
}

let currentReactiveSubscriber: ReactiveSubscriber | null = null

function clearSubscriptions(subscriber: ReactiveSubscriber): void {
  for (const subscribersSet of subscriber.subscriptions) {
    subscribersSet.delete(subscriber)
  }
  subscriber.subscriptions.clear()
}

function updateSubscribers(signalSubscribers: SubscribersSet): void {
  if (!currentReactiveSubscriber) return
  signalSubscribers.add(currentReactiveSubscriber)
  currentReactiveSubscriber.subscriptions.add(signalSubscribers)
}

function notifySubscribers(subscribersSet: SubscribersSet): void {
  for (const subscriber of [...subscribersSet]) {
    subscriber.run()
  }
}

function createReactiveSubscriber(fn: () => void): ReactiveSubscriber {
  const subscriber: ReactiveSubscriber = {
    subscriptions: new Set(),
    run: () => {
      clearSubscriptions(subscriber)
      const previousSubscriber = currentReactiveSubscriber
      currentReactiveSubscriber = subscriber
      try {
        fn()
      } finally {
        currentReactiveSubscriber = previousSubscriber
      }
    }
  }

  return subscriber
}

export function signal<T>(initial: T): Writable<T> {
  let currentValue = initial
  const subscribers: SubscribersSet = new Set()

  return {
    get value(): T {
      updateSubscribers(subscribers)
      return currentValue
    },

    set value(nextValue: T) {
      if (Object.is(currentValue, nextValue)) return
      currentValue = nextValue
      notifySubscribers(subscribers)
    }
  }
}

export function effect(fn: () => void): void {
  const subscriber = createReactiveSubscriber(fn)
  subscriber.run()
}

export function computed<T>(fn: () => T): Readable<T> {
  let currentValue!: T
  const subscribers: SubscribersSet = new Set()

  const subscriber = createReactiveSubscriber(() => {
    let nextValue = fn()
    if (Object.is(nextValue, currentValue)) return
    currentValue = nextValue
    notifySubscribers(subscribers)
  })

  subscriber.run()

  return {
    get value() {
      updateSubscribers(subscribers)
      return currentValue
    }
  }
}