import { ChangeDetectionStrategy, Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { GameProfile } from './game-profile';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store';
import { Router, ActivatedRoute } from '@angular/router';
import { UserActions } from 'shared-library/core/store';
import * as utils from 'tns-core-modules/utils/utils';

@Component({
    selector: 'game-profile',
    templateUrl: './game-profile.component.html',
    styleUrls: ['./game-profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
@AutoUnsubscribe({ 'arrayName': 'subscriptions' })

export class GameProfileComponent extends GameProfile implements OnDestroy {

    constructor(public route: ActivatedRoute,
        public router: Router,
        public store: Store<AppState>,
        public userAction: UserActions,
        public cd: ChangeDetectorRef) {
        super(route, router, store, userAction, cd);
    }

    ngOnDestroy() {
    }

    openLink(url: string) {
        utils.openUrl(url);
    }

}