import time
import logging
import contextlib
import random
from django.core.cache import cache
from authentication.models import CustomSession, SessionStore
import filelock

lock_name = 'master_loc'

@contextlib.contextmanager
def cache_lock(key, attempts=20, expires=120):
    key = '__d_lock_%s' % key

    got_lock = False
    try:
        got_lock = _acquire_lock(key, attempts, expires)
        yield
    finally:
        if got_lock:
            _release_lock(key)

def _acquire_lock(key, attempts, expires):
    for i in xrange(0, attempts):
        stored = cache.add(key, 1, expires)
        if stored:
            print "Lock acquired"
            return True
        if i != attempts-1:
            sleep_time = (((i+1)*random.random()) + 2**i) / 2.5 + 1
            logging.debug('Sleeping for %s while trying to acquire key %s', sleep_time, key)
            time.sleep(sleep_time)
            print 'Slept for {} while trying to acquire key {}'.format(sleep_time, key)

    raise LockException('Could not acquire lock for %s' % key)

def _release_lock(key):
    cache.delete(key)
    print "Lock released"

class LockException(Exception):
    def __init__(self, *args, **kwargs):
        Exception.__init__(self, *args, **kwargs)

#######################################

def lock_decorator(func):
    def new_func(*args, **kwargs):
        # try:
        #     with cache_lock(lock_name):
        #         ret = func(self, request, **kwargs)
        #         return ret
        # except LockException:
        #     raise

        lock = filelock.FileLock(lock_name)

        try:
            with lock.acquire(timeout = 1000):
                print "got lock"
                ret = func(*args, **kwargs)
                return ret
        except filelock.Timeout:
            print "Aqcuire lock timeout"

        # with distributedlock(lock_name):
        #     ret = func(self, request, **kwargs)
        #     return ret
    return new_func

def getUniqueDictList(mylist, param): # list of dicts, dict param to identify uniqueness
    seen_items = {} # hash of seen id's
    return_list = [] # return list of dicts
    for dic in mylist:
        item_param = dic.get(param)
        if seen_items.get(item_param) == None:
            seen_items[item_param] = 1
            return_list.append(dic)
    return return_list

def createSessionForUser(username, recsys_id=0):
    session = CustomSession.objects.filter(username=username).first()
    if session == None:
        store = SessionStore()
        store['username'] = username
        store['recsys_id'] = recsys_id
        store.create()
        return CustomSession.objects.filter(pk=store.session_key).first()
    return session


def properStringForQuery(string):
    return_str = string

    # replace single quotes with two single quotes
    return_str = return_str.replace("'","''")
    return return_str
    # # enable escape characters
    # return ''.join(['E', return_str])


def is_isbn_or_upc(string):
    pass


def is_isbn(num):
    num = num.replace('-','')
    nums = list(str(num))
    if len(nums) == 10 and nums[0] == '0':
        total = 0
        for i in xrange(len(nums)-1, -1, -1):
            total += int(nums[len(nums) - i - 1]) * (i+1)
        if total % 11 == 0:
            return True
        else:
            return False
    elif len(nums) == 13 and num[0:3] == '978':
        total = 0
        for i in xrange(len(nums)):
            if (i+1) % 2 == 0:
                total += int(nums[i]) * 3
            else:
                total += int(nums[i])
        if total % 10 == 0:
            return True
        else:
            return False

def attachWhere():
    return "where "

def whereLikeOrClause(field, values):
    '''
       does a '%XYZ%' SQL match with field lower cased
    '''
    template = "lower({}) like '%{}%'".format(field, {})
    query = ""
    if len(values) == 0:
        return ""
    elif len(values) == 1:
        query += template.format(values[0].lower()) + ' '
    else:
        for val in values:
            query += template.format(val.lower())
            query += ' and '
        query = query[:-4]

    return query

def whereNumRangeClause(field, low, high):
    query = "cast({} as float) between {} and {} ".format(field, low, high)
    return query

# NOTE: assumes item ids are string type in DH
def whereInClause(field, values, notIn, *args): 
    '''
        args: is another set of field, values, notIn
        used for AND clause
    '''
    if notIn:
        query = "where {} not in ".format(field)
    else:
        query = "where {} in ".format(field)

    if len(values) == 0:
        return ""
    elif len(values) == 1:
        query += "('"+values[0]+"') "
    else:
        query += "{} ".format(tuple(values))
    
    if len(args) % 3 == 0:
        for i in range(len(args)/3):
            field, values, notIn = args[3*i], args[3*i+1], args[3*i+2]
            if field == '' or field == None:
                continue
            if len(values) != 0:
                if notIn:
                    query += "and {} not in ".format(field)
                else:
                    query += "and {} in ".format(field)

                if len(values) == 1:
                    query += "('"+values[0]+"') "
                else:
                    query += "{} ".format(tuple(values))
    else:
        raise Exception("number of arguments needs to be multiple of 3")
    return query
