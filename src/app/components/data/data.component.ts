import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, GoogleChartsModule],
  templateUrl: './data.component.html',
  styleUrl: './data.component.css'
})

export class DataComponent implements OnInit, OnChanges {
  @Input() users: any[] = [];
  @Input() accounts: any[] = [];
  @Input() calls: any[] = [];
  @Input() emails: any[] = [];

 
  allFilteredCalls: any[] = [];   
  filteredCalls: any[] = [];    
  filteredEmails: any[] = [];
  filteredAccounts: any[] = [];


  paginatedCalls: any[] = [];
  paginatedEmails: any[] = [];
  paginatedAccounts: any[] = [];


  currentPageCalls = 1;
  currentPageEmails = 1;
  currentPageAccounts = 1;
  itemsPerPage = 5;  

  selectedUserId: string | null = null;

  chartData: any[] = [];
  chartType: ChartType = ChartType.PieChart;
  chartOptions = { 
    title: 'Call Type Distribution',
    width: 600,
    height: 400,
    is3D: true,
    backgroundColor: '#f8f9fa'
  };

  constructor(private dataService: DataService) {}

  ngOnInit() {
 
    this.dataService.getMergedData().subscribe((data) => {
      this.users = data.users;
      this.accounts = data.accounts;
      this.calls = data.calls;
      this.emails = data.emails;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
   
    if (changes['calls'] || changes['emails']) {
      this.filterData();
    }
  }

  onUserChange(event: any) {
    this.selectedUserId = event.target.value;

   
    this.currentPageCalls = 1;
    this.currentPageEmails = 1;
    this.currentPageAccounts = 1;

    this.filterData();
  }

  filterData() {
  
    if (!this.selectedUserId) {
      this.allFilteredCalls = [];
      this.filteredCalls = [];
      this.filteredEmails = [];
      this.filteredAccounts = [];
      this.paginatedCalls = [];
      this.paginatedEmails = [];
      this.paginatedAccounts = [];
      this.chartData = [];
      return;
    }

 
    const user = this.users.find(u => u.userId === this.selectedUserId);
    if (!user) return;

    const userTerritory = user.territory;
    const userAccounts = this.accounts.filter(acc => acc.territory === userTerritory);
    this.filteredAccounts = userAccounts;

 
    const accountIds = userAccounts.map(acc => acc.id);

    this.allFilteredCalls = this.calls.filter(call => accountIds.includes(call.accountId));
    this.filteredEmails = this.emails.filter(email => accountIds.includes(email.accountId));

    this.filteredCalls = [...this.allFilteredCalls];


    this.updateChart();
    this.updatePagination();
  }

  
  updateChart() {
    if (!this.allFilteredCalls.length) {
      this.chartData = [];
      return;
    }

    const callCounts = this.allFilteredCalls.reduce((acc, call) => {
      acc[call.callType] = (acc[call.callType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

   
    this.chartData = Object.entries(callCounts).map(([type, count]) => [type, count]);
  }

  
  onChartClick(event: any) {
    const selection = event?.selection;
    if (!selection || !selection.length) {
      return;
    }

   
    const rowIndex = selection[0]?.row;
    if (rowIndex === undefined) {
      return;
    }

    
    const selectedType = this.chartData[rowIndex][0];
    if (!selectedType) return;

 
    this.filteredCalls = this.allFilteredCalls.filter(
      call => call.callType === selectedType
    );

  
    this.currentPageCalls = 1;
    this.updatePagination();
  }

  
  updatePagination() {
  
    this.paginatedCalls = this.filteredCalls.slice(
      (this.currentPageCalls - 1) * this.itemsPerPage,
      this.currentPageCalls * this.itemsPerPage
    );

 
    this.paginatedEmails = this.filteredEmails.slice(
      (this.currentPageEmails - 1) * this.itemsPerPage,
      this.currentPageEmails * this.itemsPerPage
    );


    this.paginatedAccounts = this.filteredAccounts.slice(
      (this.currentPageAccounts - 1) * this.itemsPerPage,
      this.currentPageAccounts * this.itemsPerPage
    );
  }

  getPaginationRange(totalItems: number): number[] {
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    const visiblePages = 6;
    
    let currentPage = this.currentPageCalls;

    let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let endPage = startPage + visiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - visiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }


  changePageCalls(page: number) {
    this.currentPageCalls = page;
    this.updatePagination();
  }

  changePageEmails(page: number) {
    this.currentPageEmails = page;
    this.updatePagination();
  }

  changePageAccounts(page: number) {
    this.currentPageAccounts = page;
    this.updatePagination();
  }


  getTotalPagesCalls(): number {
    return Math.ceil(this.filteredCalls.length / this.itemsPerPage);
  }

  getTotalPagesEmails(): number {
    return Math.ceil(this.filteredEmails.length / this.itemsPerPage);
  }

  getTotalPagesAccounts(): number {
    return Math.ceil(this.filteredAccounts.length / this.itemsPerPage);
  }

  getTotalCalls(accountId: string): number {
   
    return this.allFilteredCalls.filter(call => call.accountId === accountId).length;
  }

  getTotalEmails(accountId: string): number {
    return this.filteredEmails.filter(email => email.accountId === accountId).length;
  }

  getLatestCallDate(accountId: string): string {
    const accountCalls = this.allFilteredCalls.filter(call => call.accountId === accountId);
    if (accountCalls.length === 0) return 'No Calls';
    
    const latest = Math.max(...accountCalls.map(call => new Date(call.callDate).getTime()));
    return new Date(latest).toLocaleDateString();
  }

  getLatestEmailDate(accountId: string): string {
    const accountEmails = this.filteredEmails.filter(email => email.accountId === accountId);
    if (accountEmails.length === 0) return 'No Emails';
    
    const latest = Math.max(...accountEmails.map(email => new Date(email.emailDate).getTime()));
    return new Date(latest).toLocaleDateString();
  }
}
