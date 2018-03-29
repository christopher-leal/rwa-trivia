import { Component, OnInit, Input, } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators, FormArray, FormControl, ValidatorFn } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState, appState, categoryDictionary, getCategories, getTags } from '../../../store';
import { User, Subscription } from '../../../model';
import * as socialActions from '../../../social/store/actions';
import { Observable } from 'rxjs/Observable';
import { userState } from '../../../user/store';
import { socialState } from '../../store';
import * as userActions from '../../../user/store/actions';

const EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

@Component({
  selector: 'newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent implements OnInit {

  subscriptionForm: FormGroup;
  user: User;
  isSubscribed: Boolean = false;
  totalCount: Number = 0;
  message = '';

  constructor(private fb: FormBuilder, private store: Store<AppState>, ) {
    this.store.select(appState.userState).select(s => s.user).subscribe(user => {

      this.user = user;
      if (user) {
        this.user = user;
        this.subscriptionForm = this.fb.group({
          email: [this.user.email]
        });
      }
    });
    this.store.select(socialState).select(s => s.checkEmailSubscriptionStatus).subscribe(status => {

      if (status === true) {
        this.isSubscribed = true;
        this.message = 'This EmailId is already Subscribed!!';
      } else if (status === false) {
        this.isSubscribed = true;
        this.store.dispatch(new socialActions.GetTotalSubscriber());
        this.message = 'Your EmailId is Successfully Subscribed!!';
      }
    });
    this.store.select(socialState).select(s => s.getTotalSubscriptionStatus).subscribe(subscribers => {
      this.totalCount = subscribers['count'];
    });
    // this.store.select(socialState).select(s => s.subscriptionRemoveStatus).subscribe(status => {
    //   if (status === 'SUCCESS') {
    //     this.user.isSubscribed = false;
    //     this.isSubscribed = false;
    //   }
    // });
  }

  ngOnInit() {
    this.subscriptionForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.pattern(EMAIL_REGEXP)])]
    });
    this.store.dispatch(new socialActions.GetTotalSubscriber());
  }

  onSubscribe() {
    if (!this.subscriptionForm.valid) {
      return;
    } else {
      const request = {};
      if (this.user) {
        request['userId'] = this.user.userId;
        request['email'] = this.subscriptionForm.get('email').value;
        this.store.dispatch(new socialActions.AddSubscriber(
          { subscription: new Subscription(request), user: this.user }));
      } else {
        request['email'] = this.subscriptionForm.get('email').value;
        this.store.dispatch(new socialActions.AddSubscriber(
          { subscription: new Subscription(request), user: this.user }));
      }
    }

  }
  // onUnSubscribe() {
  //   this.store.dispatch(new socialActions.RemoveSubscriber({ created_uid: this.user.userId }));

  // }
}
