---
title: Portfolio
layout: page
icon: fas fa-paintbrush
order: 4
---

<style>
  .post-image {
    margin-top: 0!important;
    margin-bottom: 0!important;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
  }

  .card {
    border: 0;
    background: var(--card-bg);
    box-shadow: var(--card-shadow);
  }
</style>

<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
  {% for post in site.data.artstation.data%}
    {% assign thumbnail = post.cover.small_square_url %}
    {% assign parts = post.title | split: "|" %}
    {% assign before_pipe = parts | first %}
    {% assign after_pipe = parts | last %}
    <div class="col">
      <div class="card h-100">
      <a href="{{ post.permalink }}" class="stretched-link"></a>
        <img class="card-img-top post-image" src="{{ thumbnail }}" alt="{{ before_pipe }}" />
        <div class="card-body">
          <p class="card-title"><a class="streched-link" href="{{ post.permalink }}">{{ before_pipe }}</a></p>
          {% if post.title contains "|" %}
            <div class="card-subtitle ">
              <small class="text-body-secondary">{{ after_pipe }}</small>
            </div>
          {% endif %}
        </div>
        <div class="card-footer">
          <small class="text-muted">
            <i class="fas fa-calendar" style="margin-right: 0.5rem"></i>
            {{ post.published_at | date: "%b %-d, %Y" }}
          </small>
        </div>
      </div>
    </div>
  {% endfor %}
</div>
