import os
import sys
import json
import copy
import pandas as pd
import nltk.data
import time


def save_json(data, file):
    with open(file, 'w', encoding='utf8') as f:
        json.dump(data, f, ensure_ascii=False)


def load_json(file):
    with open(file, 'r', encoding='utf8') as f:
        data = json.load(f)
    return data


def read_sentiment_list(in_csv, return_freq=False):
    df = pd.read_csv(in_csv, header=None)
    df = df.replace(pd.np.nan, '', regex=True)
    positive_words = list(df[0])
    negative_words = list(df[2])
    positive_words_freq = list(df[1])
    negative_words_freq = list(df[3])
    try:
        end_index = positive_words.index('')
        positive_words = positive_words[:end_index]
        positive_words_freq = positive_words_freq[:end_index]
    except ValueError:
        pass
    try:
        end_index = negative_words.index('')
        negative_words = negative_words[:end_index]
        negative_words_freq = negative_words_freq[:end_index]
    except ValueError:
        pass
    if return_freq:
        return positive_words, negative_words, positive_words_freq, negative_words_freq
    else:
        return positive_words, negative_words


def get_word_tree(word, corpus_folder):
    files = [os.path.join(corpus_folder, x) for x in os.listdir(corpus_folder) if x.endswith('.txt')]
    sent_detector = nltk.data.load('third_party/nltk/punkt/english.pickle')
    word_before = {}
    word_after = {}

    def insert_sentence(word_tree, tokens):
        if len(tokens) == 0:
            return
        current_node = word_tree
        for token in tokens:
            if token not in current_node:
                current_node[token] = {}
            current_node = current_node[token]

    for file in files:
        try:
            with open(file, 'r', encoding='utf8') as f:
                content = ' '.join([x.strip() for x in f.readlines()])
        except UnicodeDecodeError:
            with open(file, 'r') as f:
                content = ' '.join([x.strip() for x in f.readlines()])
        sentences = sent_detector.tokenize(content)
        for sent in sentences:
            tokens = sent.split()
            if word not in tokens:
                continue
            index = tokens.index(word)
            before_tokens = tokens[:index]
            before_tokens.reverse()
            after_tokens = tokens[index + 1:]
            insert_sentence(word_before, before_tokens)
            insert_sentence(word_after, after_tokens)

    def merge_tree(node, reverse):
        change_flag = True
        while change_flag:
            change_flag = False
            new_node: dict = copy.deepcopy(node)
            for key, value in node.items():
                if len(value) == 1:
                    new_node.pop(key)
                    if reverse:
                        new_key = list(value.keys())[0] + ' ' + key
                    else:
                        new_key = key + ' ' + list(value.keys())[0]
                    new_node[new_key] = list(value.values())[0]
                    change_flag = True
            node = copy.deepcopy(new_node)
        new_node = {}
        for key, value in node.items():
            new_node[key] = merge_tree(value, reverse)
        return new_node

    word_before = merge_tree(word_before, True)
    word_after = merge_tree(word_after, False)

    def dfs_convert(node):
        converted = []
        if len(node) == 0:
            return []
        for key, value in node.items():
            children = dfs_convert(value)
            converted_node = {'name': key, 'children': children}
            if len(children) == 0:
                converted_node['freq'] = 1
            else:
                converted_node['freq'] = sum(map(lambda x: x['freq'], children))
            converted.append(converted_node)
        converted.sort(key=lambda x: x['freq'], reverse=True)
        return converted

    word_before = dfs_convert({word: word_before})[0]
    word_after = dfs_convert({word: word_after})[0]
    return word_before, word_after


def print_info_with_time(s):
    print('%s: %s' % (time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time())), s))
    sys.stdout.flush()


def convert_to_tree(word_list, freq_list):
    tree = [{'title': chr(x), 'key': chr(x), 'children': []} for x in range(65, 91)]
    tree.append({'title': '#', 'key': '#', 'children': []})
    for word, freq in zip(word_list, freq_list):
        first_chr_ord = ord(word.upper()[0]) - 65
        if first_chr_ord < 0 or first_chr_ord > 25:
            first_chr_ord = -1
        tree[first_chr_ord]['children'].append({'title': word, 'key': word, 'freq': freq, 'children': []})
    for node in tree:
        node['children'].sort(key=lambda x: x['title'].lower())
    return tree


def merge_json(folder, word_list):
    res = {}
    for word in word_list:
        res[word] = {'before': load_json(os.path.join(folder, '%s.before.json' % word)),
                     'after': load_json(os.path.join(folder, '%s.after.json' % word))}
    return res


def main():
    sentiment_csv = 'dataSource/sentiment.csv'
    corpus_folder = 'dataSource/txtSource'
    output_folder = 'dataSource/wordTrees'
    os.makedirs(output_folder, exist_ok=True)
    positive_words, negative_words, positive_words_freq, negative_words_freq = read_sentiment_list(sentiment_csv, True)
    sentiment_word_data = {'positive': convert_to_tree(positive_words, positive_words_freq),
                           'negative': convert_to_tree(negative_words, negative_words_freq)}
    save_json(sentiment_word_data, os.path.join('dataSource', 'sentimentWords.json'))
    for word in positive_words + negative_words:
        word_before, word_after = get_word_tree(word, corpus_folder)
        save_json(word_before, os.path.join(output_folder, '%s.before.json' % word))
        save_json(word_after, os.path.join(output_folder, '%s.after.json' % word))
        print_info_with_time('word %s done' % word)
    word_tree_data = {'positive': merge_json(output_folder, positive_words),
                      'negative': merge_json(output_folder, negative_words)}
    save_json(word_tree_data, 'dataSource/wordTrees.json')


if __name__ == '__main__':
    main()
