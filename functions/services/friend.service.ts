import admin from '../db/firebase.client';
import { Utils } from '../utils/utils';
import { CollectionConstants, GeneralConstants } from '../../projects/shared-library/src/lib/shared/model';

export class FriendService {

    private static friendFireStoreClient = admin.firestore();
    private static FS = GeneralConstants.FORWARD_SLASH;

    /**
     * createInvitation
     * return ref
     */
    static async createInvitation(dbInvitation: any): Promise<any> {
        try {
            return await FriendService.friendFireStoreClient.collection(CollectionConstants.INVITATIONS).add(dbInvitation);
        } catch (error) {
            return Utils.throwError(error);
        }
    }

    /**
     * getInvitationByToken
     * return invitation
     */
    static async getInvitationByToken(token: any): Promise<any> {
        try {
            const invitationData = await FriendService.friendFireStoreClient
                .doc(`${FriendService.FS}${CollectionConstants.INVITATIONS}${FriendService.FS}${token}`)
                .get();
            return invitationData.data();
        } catch (error) {
            return Utils.throwError(error);
        }
    }

    /**
     * checkInvitation
     * return invitation
     */
    static async checkInvitation(email: string, userId: string): Promise<any> {
        try {
            return Utils.getValesFromFirebaseSnapshot(
                await FriendService.friendFireStoreClient
                    .collection(CollectionConstants.INVITATIONS)
                    .where(GeneralConstants.CREATED_UID, GeneralConstants.DOUBLE_EQUAL, userId)
                    .where(GeneralConstants.EMAIL, GeneralConstants.DOUBLE_EQUAL, email)
                    .get()
            );
        } catch (error) {
            return Utils.throwError(error);
        }
    }

    /**
     * updateInvitation
     * return userId
     */
    static async updateInvitation(invitation: any) {
        try {
            return await FriendService.friendFireStoreClient
                .doc(`${FriendService.FS}${CollectionConstants.INVITATIONS}${FriendService.FS}${invitation.id}`)
                .update(invitation);
        } catch (error) {
            return Utils.throwError(error);
        }
    }

    /**
     * getFriendByInvitee
     * return friend
     */
    static async getFriendByInvitee(invitee: any): Promise<any> {
        try {
            const friends = await FriendService.friendFireStoreClient
                .doc(`${FriendService.FS}${CollectionConstants.FRIENDS}${FriendService.FS}${invitee}`)
                .get();
            return friends.data();
        } catch (error) {
            return Utils.throwError(error);
        }
    }

    /**
     * updateFriend
     * return ref
     */
    static async updateFriend(myFriends: any, invitee: any): Promise<any> {
        try {
            return await FriendService.friendFireStoreClient
                .doc(`${FriendService.FS}${CollectionConstants.FRIENDS}${FriendService.FS}${invitee}`)
                .update({ myFriends: myFriends });
        } catch (error) {
            return Utils.throwError(error);
        }
    }

    /**
     * setFriend
     * return ref
     */
    static async setFriend(dbUser: any, invitee: any): Promise<any> {
        try {
            return await FriendService.friendFireStoreClient
                .doc(`${FriendService.FS}${CollectionConstants.FRIENDS}${FriendService.FS}${invitee}`)
                .set(dbUser);
        } catch (error) {
            return Utils.throwError(error);
        }
    }

}
