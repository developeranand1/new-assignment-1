import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private usersUrl = '/json/user.json';
  private accountsUrl = '/json/accounts.json';
  private callsUrl = '/json/calls.json';
  private emailsUrl = '/json/emails.json';

  constructor(private http: HttpClient) {}

  getMergedData(): Observable<any> {
    return forkJoin({
      users: this.http.get<any[]>(this.usersUrl),
      accounts: this.http.get<any[]>(this.accountsUrl),
      calls: this.http.get<any[]>(this.callsUrl),
      emails: this.http.get<any[]>(this.emailsUrl),
    }).pipe(
      map(({ users, accounts, calls, emails }) => {

        const mergedAccounts = accounts.map(account => {
          const user = users.find(u => u.territory === account.territory);
          return { ...account, user };
        });

      
        const mergedCalls = calls.map(call => ({
          ...call,
          account: mergedAccounts.find(acc => acc.id === call.accountId) || { name: 'Unknown' }
        }));

        const mergedEmails = emails.map(email => ({
          ...email,
          account: mergedAccounts.find(acc => acc.id === email.accountId) || { name: 'Unknown' }
        }));

        return { users, accounts: mergedAccounts, calls: mergedCalls, emails: mergedEmails };
      })
    );
  }
}
