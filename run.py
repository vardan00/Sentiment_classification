import twitter
from pymongo import MongoClient
from flask import Flask, render_template, request, jsonify
from helper import getTweets, preprocess_wordcount
import helper
import pickle

'''
    Importing already trained machine learning algorithms
    The package used is pickle. Here it is used to store and retrieve the stored
    mathematical model (Actually called as serializing the object).
    https://docs.python.org/2/library/pickle.html
'''
linearSVC = pickle.load(open("LinearSVC_classifier.pickle", "rb"))

'''
    The Api function is from the twitter package is used to establish connection
    with the twitter server. 
    There are many packages online for getting the data. We are using bear-python
    https://github.com/bear/python-twitter
'''
apiHandler = twitter.Api()

app = Flask(__name__)

'''
    Here we are establishing connection with the data base using the
    pymongo (python mongodb) connector. Using two databases twitter for storing
    the twitter data. Wordcount to store the frequency of words.
'''
client = MongoClient("localhost", 27017)
db = client["twitter"] 
ndb = client["wordcount"]

'''
    The main fuction that is called the moment a request is sent to the server.
'''
@app.route('/', methods = ['POST', 'GET'])
def start():
	return render_template('home.html')

'''
    This is the function that is called when a term is asked entered for search.
'''
@app.route('/search', methods = ['POST', 'GET'])
def search_tweets():
    tweets = []
#   The recent is used to avoid from the getting the same data
    recent_id = 0
    if request.method == "POST":
        search_term = (str(request.data)[5:-1]).lower()

#        We get only at the most 100 tweet for every search so repeat it several
#        times to get more tweets.
        for x in range(0, 7):
            try:
#                the getTweets is a function from the helper filee
                recent_id = getTweets(db, search_term, recent_id, apiHandler)
            except:
                pass
            
#    Retreive the stored twitter data from the database
    collection = db[search_term]

#    Querying on the database fetch all the text part of all the documents
    record = collection.find({},{"_id":0,"text":1})
    
    flag = True
    while flag:
        tweets.append(record.next())
        flag = record.alive
#    Tokenize each tweet and stord the frequency using the function from the helper file
    preprocess_wordcount(tweets,ndb,search_term)
    collection = ndb[search_term]
    record = collection.find({}, {"_id":0, "word":1, "count":1}).sort("count",-1).limit(100)
    records = []
    flag = True
    while flag:
        k = record.next()
        records.append(k)
        flag = record.alive
    collection.drop()
#    Return the data in json format
    return jsonify({"data":records})
    
    
#    This function classifies the tweets in to different categories
@app.route('/classify', methods = ['POST', 'GET'])
def classify():
    search_term = (str(request.data)[5:-1]).lower()
    tweets = []
    
    # fetching the stored data from the local data base
    collection = db[search_term]
    record = collection.find({},{"_id":0,"text":1}).limit(100)
    
    flag = True
    while flag:
        tweets.append(record.next())
        flag = record.alive
    
    # the function from the helper file classifies the tweets and stores them in the database    
    helper.classification_initiate(client, tweets, search_term)
  
  	# Retreive the classified tweets from the database
    cursor = client["tweetsClassified"][search_term]
    result = []
    result.append(cursor.find({"sentiment":"positive"}).count())
    result.append(cursor.find({"sentiment":"negative"}).count())
    result.append(cursor.find({"sentiment":"neutral"}).count())
    
    # return the data data to frontend
    return jsonify({"data":result})
    
if __name__ == "__main__":
	app.run(host = '0.0.0.0',port = 7896, debug=True)