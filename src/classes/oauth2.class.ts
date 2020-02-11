import oauth from 'oauth2orize';
import passport from 'passport';
import login from 'connect-ensure-login';
import uuidV4 from 'uuid/v4';
import jwt from 'jsonwebtoken';
import short from 'short-uuid';

import user from '../resources/user/user.model';
import client from '../resources/client/client.model';
import authorisationCode from '../resources/authorisationCode/authorisationCode.model';
import accessToken from '../resources/accessToken/accessToken.model';
import refreshToken from '../resources/refreshToken/refreshToken.model';

class Oauth2 {}

export default Oauth2;
