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

let currentSubscriber: ReactiveSubscriber | null = null

function clearSubscriptions(subscriber: ReactiveSubscriber): void {
  for (const subscribersSet of subscriber.subscriptions) {
    subscribersSet.delete(subscriber)
  }
  subscriber.subscriptions.clear()
}

function collectDependency(subscribersSet: SubscribersSet): void {
  if (!currentSubscriber) return
  subscribersSet.add(currentSubscriber)
  currentSubscriber.subscriptions.add(subscribersSet)
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
      const previousSubscriber = currentSubscriber
      currentSubscriber = subscriber
      try {
        fn()
      } finally {
        currentSubscriber = previousSubscriber
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
      collectDependency(subscribers)
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
  let hasValue = false
  const subscribers: SubscribersSet = new Set()

  const subscriber = createReactiveSubscriber(() => {
    const nextValue = fn()

    if (!hasValue || !Object.is(currentValue, nextValue)) {
      currentValue = nextValue
      hasValue = true
      notifySubscribers(subscribers)
    }
  })

  subscriber.run()

  return {
    get value(): T {
      collectDependency(subscribers)
      return currentValue
    }
  }
}