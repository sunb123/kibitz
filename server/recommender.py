import math
import os
import sys
import requests
import urllib
import zipfile
from time import time
from pyspark.mllib.recommendation import ALS, MatrixFactorizationModel, Rating
from pyspark import SparkContext, SparkConf
from pyspark.sql import SQLContext

# Need to use django py modules
import django
django.setup()

from recsys.models import Recsys
from app.models import Rating

sc = SparkContext()
sqlContent = SQLContext(sc)

recsys_id = sys.argv[1]
user_id = sys.argv[2]
recommendation_limit = int(sys.argv[3])

# NOTE: makes recommendation only on the items of the given collection.
# query = "select * from {}.{} where recsys_id='{}' order by id asc;" \
#     .format(master_repo, rating_table, recsys_id)
# resp = makeRequest('POST', master_dh_query_url, 'master', query=query)
# rows = resp.json()['rows']

#rows = Recsys.objects.filter(recsys_id=recsys_id)
# print rows

rows = Rating.objects.filter(recsys_id=recsys_id)

if rows.count() > 0:
	def convertToTuples(rows):
	    mylist = []
	    for r in rows:
		rating_tuple = (r.user_id,r.item_id,r.rating)
		mylist.append(rating_tuple)
	    return mylist

	#print convertToTuples(rows)
	dataset = sc.parallelize(convertToTuples(rows))

	training_RDD, validation_RDD, test_RDD = dataset.randomSplit([1, 0, 0], seed=0L)
	validation_for_predict_RDD = validation_RDD.map(lambda x: (x[0], x[1]))
	test_for_predict_RDD = test_RDD.map(lambda x: (x[0], x[1]))

	seed = 5L
	iterations = 10
	regularization_parameter = 0.1
	ranks = [4, 8, 12]
	errors = [0, 0, 0]
	err = 0
	tolerance = 0.02

	# min_error = float('inf')
	# best_rank = -1
	# best_iteration = -1

	# for rank in ranks: #ranks = [4,8,12]
	#     model = ALS.train(training_RDD, rank, seed=seed, iterations=iterations,
	#                       lambda_=regularization_parameter)
	#     predictions = model.predictAll(validation_for_predict_RDD).map(lambda r: ((r[0], r[1]), r[2]))
	#     rates_and_preds = validation_RDD.map(lambda r: ((int(r[0]), int(r[1])), float(r[2]))).join(predictions)
	#     error = math.sqrt(rates_and_preds.map(lambda r: (r[1][0] - r[1][1])**2).mean())
	#     errors[err] = error
	#     err += 1
	#     print 'For rank %s the RMSE is %s' % (rank, error)
	#     if error < min_error:
	#         min_error = error
	#         best_rank = rank
	# print 'The best model was trained with rank %s' % best_rank

	best_rank = 4

	# TODO: find rank of model that has least error
	model = ALS.train(training_RDD, best_rank, seed=seed, iterations=iterations,
			      lambda_=regularization_parameter)
	# predictions = model.predictAll(test_for_predict_RDD).map(lambda r: ((r[0], r[1]), r[2]))
	# rates_and_preds = test_RDD.map(lambda r: ((int(r[0]), int(r[1])), float(r[2]))).join(predictions)
	# error = math.sqrt(rates_and_preds.map(lambda r: (r[1][0] - r[1][1])**2).mean())

	# def get_counts_and_averages(ID_and_ratings_tuple):
	#     nratings = len(ID_and_ratings_tuple[1])
	#     return ID_and_ratings_tuple[0], (nratings, float(sum(x for x in ID_and_ratings_tuple[1]))/nratings)

	# item_ID_with_ratings_RDD = (dataset.map(lambda x: (x[1], x[2])).groupByKey())
	# item_ID_with_avg_ratings_RDD = item_ID_with_ratings_RDD.map(get_counts_and_averages)
	# item_rating_counts_RDD = item_ID_with_avg_ratings_RDD.map(lambda x: (x[0], x[1][0]))

	user_ID = int(user_id)

	user_rated_item_ids = dataset.filter(lambda x: x[0] == str(user_ID)).map(lambda x: x[1]).collect()

	unrated_items = dataset.filter(lambda x: x[1] not in user_rated_item_ids).map(lambda x: (str(user_ID), x[1]))

	ratings = model.predictAll(unrated_items).take(recommendation_limit)

	output_ratings = []
	for r in ratings:
	    output_ratings.append({'user_id':r.user, 'item_id':r.product, 'rating':r.rating})

	print output_ratings

else:
	print []
# product_features = model.productFeatures().take(100)
# print product_features









###########################################
###########################################
###########################################
###########################################






# NOTE: The format of each line is (userID, movieID, rating)

# new_user_ratings = [
#      ('0','1','4'),
#      ('0','2','4'),
#      ('0','3','3'),
#      ('0','4','3'),
#      ('0','5','2'),
#      ('0','6','2'),
#     ]
# new_user_ratings_RDD = sc.parallelize(new_user_ratings)
# #print 'New user ratings: %s' % new_user_ratings_RDD.take(10)

# dataset_with_new_ratings_RDD = dataset.union(new_user_ratings_RDD)



# t0 = time()
# new_ratings_model = ALS.train(dataset_with_new_ratings_RDD, best_rank, seed=seed,
#                               iterations=iterations, lambda_=regularization_parameter)
# tt = time() - t0

#print "New model trained in %s seconds" % round(tt,3)


# new_user_ratings_ids = map(lambda x: x[1], new_user_ratings) # get just movie IDs

# print new_user_ratings_ids

# # keep just those not on the ID list (thanks Lei Li for spotting the error!)
# new_user_unrated_items_RDD = (dataset.filter(lambda x: x[1] not in new_user_ratings_ids).map(lambda x: (new_user_ID, x[1])))

# print new_user_unrated_items_RDD.take(100)

# # Use the input RDD, new_user_unrated_movies_RDD, with new_ratings_model.predictAll() to predict new ratings for the movies
# new_user_recommendations_RDD = new_ratings_model.predictAll(new_user_unrated_items_RDD)

# print new_user_recommendations_RDD.take(100)







# small_movies_titles = small_movies_data.map(lambda x: (int(x[0]),x[1]))

# # Transform new_user_recommendations_RDD into pairs of the form (Movie ID, Predicted Rating)
# new_user_recommendations_rating_RDD = new_user_recommendations_RDD.map(lambda x: (x.product, x.rating))
# new_user_recommendations_rating_title_and_count_RDD = \
#     new_user_recommendations_rating_RDD.join(small_movies_titles).join(movie_rating_counts_RDD)

# new_user_recommendations_rating_title_and_count_RDD.take(3)

# new_user_recommendations_rating_title_and_count_RDD = \
#     new_user_recommendations_rating_title_and_count_RDD.map(lambda r: (r[1][0][1], r[1][0][0], r[1][1]))

# top_movies = new_user_recommendations_rating_title_and_count_RDD.filter(lambda r: r[2]>=25).takeOrdered(25, key=lambda x: -x[1])

# print ('TOP recommended movies (with more than 25 reviews):\n%s' %
#        '\n'.join(map(str, top_movies)))

###############################3


# small_dataset_url = 'http://files.grouplens.org/datasets/movielens/ml-latest-small.zip'

# datasets_path = os.path.join('.', 'datasets')


# ######################
# # Get Data (ratings)
# ######################
# small_dataset_path = os.path.join(datasets_path, 'ml-latest-small.zip')

# small_f = urllib.urlretrieve(small_dataset_url, small_dataset_path)

# with zipfile.ZipFile(small_dataset_path, "r") as z:
#     z.extractall(datasets_path)



# small_ratings_file = os.path.join(datasets_path, 'ml-latest-small', 'ratings.csv')

# small_ratings_raw_data = sc.textFile(small_ratings_file)
# small_ratings_raw_data_header = small_ratings_raw_data.take(1)[0]

# small_ratings_data = small_ratings_raw_data.filter(lambda line: line!=small_ratings_raw_data_header)\
#     .map(lambda line: line.split(",")).map(lambda tokens: (float(tokens[0]),float(tokens[1]),float(tokens[2]))).cache()

# print small_ratings_data.take(3)



# small_movies_file = os.path.join(datasets_path, 'ml-latest-small', 'movies.csv')

# small_movies_raw_data = sc.textFile(small_movies_file)
# small_movies_raw_data_header = small_movies_raw_data.take(1)[0]

# small_movies_data = small_movies_raw_data.filter(lambda line: line!=small_movies_raw_data_header)\
#     .map(lambda line: line.split(",")).map(lambda tokens: (float(tokens[0]),tokens[1])).cache()

# print small_movies_data.take(3)

# #####################
# # Create data sets
# #####################
# training_RDD, validation_RDD, test_RDD = small_ratings_data.randomSplit([6, 2, 2], seed=0L)
# validation_for_predict_RDD = validation_RDD.map(lambda x: (x[0], x[1]))
# test_for_predict_RDD = test_RDD.map(lambda x: (x[0], x[1]))

# seed = 5L
# iterations = 10
# regularization_parameter = 0.1
# ranks = [4, 8, 12]
# errors = [0, 0, 0]
# err = 0
# tolerance = 0.02

# min_error = float('inf')
# best_rank = -1
# best_iteration = -1

# for rank in ranks: #ranks = [4,8,12]
#     model = ALS.train(training_RDD, rank, seed=seed, iterations=iterations,
#                       lambda_=regularization_parameter)
#     predictions = model.predictAll(validation_for_predict_RDD).map(lambda r: ((r[0], r[1]), r[2]))
#     rates_and_preds = validation_RDD.map(lambda r: ((int(r[0]), int(r[1])), float(r[2]))).join(predictions)
#     error = math.sqrt(rates_and_preds.map(lambda r: (r[1][0] - r[1][1])**2).mean())
#     errors[err] = error
#     err += 1
#     print 'For rank %s the RMSE is %s' % (rank, error)
#     if error < min_error:
#         min_error = error
#         best_rank = rank
# #print 'The best model was trained with rank %s' % best_rank

# model = ALS.train(training_RDD, best_rank, seed=seed, iterations=iterations,
#                       lambda_=regularization_parameter)
# predictions = model.predictAll(test_for_predict_RDD).map(lambda r: ((r[0], r[1]), r[2]))
# rates_and_preds = test_RDD.map(lambda r: ((int(r[0]), int(r[1])), float(r[2]))).join(predictions)
# error = math.sqrt(rates_and_preds.map(lambda r: (r[1][0] - r[1][1])**2).mean())

# #print 'For testing data the RMSE is %s' % (error)



# def get_counts_and_averages(ID_and_ratings_tuple):
#     nratings = len(ID_and_ratings_tuple[1])
#     return ID_and_ratings_tuple[0], (nratings, float(sum(x for x in ID_and_ratings_tuple[1]))/nratings)

# movie_ID_with_ratings_RDD = (small_ratings_data.map(lambda x: (x[1], x[2])).groupByKey())
# movie_ID_with_avg_ratings_RDD = movie_ID_with_ratings_RDD.map(get_counts_and_averages)
# movie_rating_counts_RDD = movie_ID_with_avg_ratings_RDD.map(lambda x: (x[0], x[1][0]))


# new_user_ID = 0

# # The format of each line is (userID, movieID, rating)
# new_user_ratings = [
#      (0,260,4), # Star Wars (1977)
#      (0,1,3), # Toy Story (1995)
#      (0,16,3), # Casino (1995)
#      (0,25,4), # Leaving Las Vegas (1995)
#      (0,32,4), # Twelve Monkeys (a.k.a. 12 Monkeys) (1995)
#      (0,335,1), # Flintstones, The (1994)
#      (0,379,1), # Timecop (1994)
#      (0,296,3), # Pulp Fiction (1994)
#      (0,858,5) , # Godfather, The (1972)
#      (0,50,4) # Usual Suspects, The (1995)
#     ]
# new_user_ratings_RDD = sc.parallelize(new_user_ratings)
# #print 'New user ratings: %s' % new_user_ratings_RDD.take(10)

# small_data_with_new_ratings_RDD = small_ratings_data.union(new_user_ratings_RDD)



# t0 = time()
# new_ratings_model = ALS.train(small_data_with_new_ratings_RDD, best_rank, seed=seed,
#                               iterations=iterations, lambda_=regularization_parameter)
# tt = time() - t0

# #print "New model trained in %s seconds" % round(tt,3)


# new_user_ratings_ids = map(lambda x: x[1], new_user_ratings) # get just movie IDs
# # keep just those not on the ID list (thanks Lei Li for spotting the error!)
# new_user_unrated_movies_RDD = (small_movies_data.filter(lambda x: x[0] not in new_user_ratings_ids).map(lambda x: (new_user_ID, x[0])))

# # Use the input RDD, new_user_unrated_movies_RDD, with new_ratings_model.predictAll() to predict new ratings for the movies
# new_user_recommendations_RDD = new_ratings_model.predictAll(new_user_unrated_movies_RDD)




# small_movies_titles = small_movies_data.map(lambda x: (int(x[0]),x[1]))


# # # Transform new_user_recommendations_RDD into pairs of the form (Movie ID, Predicted Rating)
# new_user_recommendations_rating_RDD = new_user_recommendations_RDD.map(lambda x: (x.product, x.rating))
# new_user_recommendations_rating_title_and_count_RDD = \
#     new_user_recommendations_rating_RDD.join(small_movies_titles).join(movie_rating_counts_RDD)

# # new_user_recommendations_rating_title_and_count_RDD.take(3)

# new_user_recommendations_rating_title_and_count_RDD = \
#     new_user_recommendations_rating_title_and_count_RDD.map(lambda r: (r[1][0][1], r[1][0][0], r[1][1]))

# top_movies = new_user_recommendations_rating_title_and_count_RDD.filter(lambda r: r[2]>=25).takeOrdered(25, key=lambda x: -x[1])

# #print ('TOP recommended movies (with more than 25 reviews):\n%s' %
# #        '\n'.join(map(str, top_movies)))

###########################################
###########################################

# complete_movies_file = os.path.join(datasets_path, 'ml-latest', 'movies.csv')
# complete_movies_raw_data = sc.textFile(complete_movies_file)
# complete_movies_raw_data_header = complete_movies_raw_data.take(1)[0]

# # Parse
# complete_movies_data = complete_movies_raw_data.filter(lambda line: line!=complete_movies_raw_data_header)\
#     .map(lambda line: line.split(",")).map(lambda tokens: (int(tokens[0]),tokens[1],tokens[2])).cache()

# complete_movies_titles = complete_movies_data.map(lambda x: (int(x[0]),x[1]))

# print "There are %s movies in the complete dataset" % (complete_movies_titles.count()




# data = sc.textFile("./text.txt")
# ratings = data.map(lambda l: l.split(','))\
#     .map(lambda l: Rating(int(l[0]), int(l[1]), float(l[2])))


# print ratings


# # Build the recommendation model using Alternating Least Squares
# rank = 10
# numIterations = 10
# model = ALS.train(ratings, rank, numIterations)

# # Evaluate the model on training data
# testdata = ratings.map(lambda p: (p[0], p[1]))

# predictions = model.predictAll(testdata).map(lambda r: ((r[0], r[1]), r[2]))

# ratesAndPreds = ratings.map(lambda r: ((r[0], r[1]), r[2])).join(predictions)

# MSE = ratesAndPreds.map(lambda r: (r[1][0] - r[1][1])**2).mean()
# print("Mean Squared Error = " + str(MSE))

# model.save(sc, "target/tmp/myCollaborativeFilter")
# sameModel = MatrixFactorizationModel.load(sc, "target/tmp/myCollaborativeFilter")

# # print textFile.count()
# # print textFile.first()
