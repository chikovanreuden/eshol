SELECT * FROM `eshol`.ci AS c
RIGHT JOIN `eshol`.ciUser AS u
ON c.ciUid = u.ci_ciUid;