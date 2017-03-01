from recsys.models import Recsys

def checkRecsysUrlUnique(url):
    recsys = Recsys.objects.filter(url_name=url).first()
    return recsys == None