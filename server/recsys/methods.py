import string
from recsys.models import Recsys
from app.global_vars import KIBITZ_TABLE_MARKER

def checkRecsysUrlUnique(url):
    recsys = Recsys.objects.filter(url_name=url).first()
    return recsys == None

def checkUrlFormat(url):
    # May only contain alphanumeric characters and underscores, 
    # must begin with a letter
    # must not begin or end with an underscore.
    validChars = string.letters + string.digits + '_' + '-'
    if url[0] == '_' or url[-1] == '_':
        return False
    if url[0] not in string.letters:
        return False
    for char in url:
        if char not in validChars:
            return False

    return True

def formatUrl(url):
    # change hyphen to underscore
    url_list = list(url)
    for i in range(len(url_list)):
        if url_list[i] == '-':
            url_list[i] = '_'
    return ''.join(url_list)

def formatTableName(url):
    return formatUrl(url) + KIBITZ_TABLE_MARKER

def formatTableHeader(header):
    '''
        Datahub will strip ends, lower case, and replace each space with an underscore
    '''
    return header.strip().lower().replace(" ","_")
