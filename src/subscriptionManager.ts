import * as vscode from 'vscode';
import { Subscription } from './types';
import { calculateExpiry } from './utils';

const STORAGE_KEY = 'subtrack.subscriptions.list';

export class SubscriptionManager {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Returns all subscriptions sorted by shortest remaining duration.
   */
  public getAll(): Subscription[] {
    const raw = this.context.globalState.get<Subscription[]>(STORAGE_KEY, []);
    const now = new Date();

    return [...raw].sort((a, b) => {
      const calcA = calculateExpiry(a.expiryDate, now);
      const calcB = calculateExpiry(b.expiryDate, now);
      return calcA.remainingMs - calcB.remainingMs;
    });
  }

  /**
   * Returns all unique icons currently in use, ordered by the earliest expiring item in that group.
   */
  public getActiveIcons(): string[] {
    const all = this.getAll();
    const iconOrder: string[] = [];

    for (const sub of all) {
      const icon = sub.icon || 'calendar';
      if (!iconOrder.includes(icon)) {
        iconOrder.push(icon);
      }
    }

    return iconOrder;
  }

  /**
   * Returns all subscriptions that use the specified icon.
   */
  public getByIcon(icon: string): Subscription[] {
    const all = this.getAll();
    return all.filter((s) => (s.icon || 'calendar') === icon);
  }

  public getById(id: string): Subscription | undefined {
    return this.getAll().find((s) => s.id === id);
  }

  public async add(subscription: Subscription): Promise<void> {
    const list = this.context.globalState.get<Subscription[]>(STORAGE_KEY, []);
    list.push(subscription);
    await this.context.globalState.update(STORAGE_KEY, list);
    this._onDidChange.fire();
  }

  public async update(subscription: Subscription): Promise<void> {
    const list = this.context.globalState.get<Subscription[]>(STORAGE_KEY, []);
    const index = list.findIndex((s) => s.id === subscription.id);
    if (index !== -1) {
      list[index] = subscription;
      await this.context.globalState.update(STORAGE_KEY, list);
      this._onDidChange.fire();
    }
  }

  public async delete(id: string): Promise<boolean> {
    const list = this.context.globalState.get<Subscription[]>(STORAGE_KEY, []);
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length !== list.length) {
      await this.context.globalState.update(STORAGE_KEY, filtered);
      this._onDidChange.fire();
      return true;
    }
    return false;
  }

  public async setAll(subscriptions: Subscription[]): Promise<void> {
    await this.context.globalState.update(STORAGE_KEY, subscriptions);
    this._onDidChange.fire();
  }

  public async clearAll(): Promise<void> {
    await this.context.globalState.update(STORAGE_KEY, []);
    this._onDidChange.fire();
  }

  public isEmpty(): boolean {
    const list = this.context.globalState.get<Subscription[]>(STORAGE_KEY, []);
    return list.length === 0;
  }
}
