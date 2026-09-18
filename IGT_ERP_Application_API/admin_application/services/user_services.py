from rest_framework.exceptions import  AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate



def create_token(**data):
    user = authenticate(username=data.get('username'), password=data.get('password'))
    if not user:
        raise AuthenticationFailed(detail='Invalid Credentials')

    refresh_tkn = RefreshToken.for_user(user)
    access_tkn = refresh_tkn.access_token
   
    return str(access_tkn), str(refresh_tkn)

